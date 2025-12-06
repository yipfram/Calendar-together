import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { sendInviteEmail, sendAddedToRoomEmail } from "@/lib/email";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type RouteParams = { params: Promise<{ id: string }> };

// POST: Join room with invite code OR add member by email
export async function POST(request: NextRequest, { params }: RouteParams) {
    const { id } = await params;
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { inviteCode, userId, email } = body;

    // If inviteCode provided, join via invite
    if (inviteCode) {
        const room = await prisma.room.findUnique({
            where: { inviteCode },
        });

        if (!room) {
            return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
        }

        // Check if already a member
        const existing = await prisma.roomMember.findUnique({
            where: { roomId_userId: { roomId: room.id, userId: session.user.id } },
        });

        if (existing) {
            return NextResponse.json({ error: "Already a member" }, { status: 400 });
        }

        const member = await prisma.roomMember.create({
            data: {
                roomId: room.id,
                userId: session.user.id,
                role: "member",
            },
        });

        return NextResponse.json({ member, room }, { status: 201 });
    }

    // For adding by email or userId, must be owner/admin
    const membership = await prisma.roomMember.findUnique({
        where: { roomId_userId: { roomId: id, userId: session.user.id } },
    });

    if (!membership || !["owner", "admin"].includes(membership.role)) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Get the room for email sending
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) {
        return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // If email is provided, look up user or send invitation
    if (email) {
        // Look up user by email
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });

        if (existingUser) {
            // User exists, check if already a member
            const existingMember = await prisma.roomMember.findUnique({
                where: { roomId_userId: { roomId: id, userId: existingUser.id } },
            });

            if (existingMember) {
                return NextResponse.json({ error: "User is already a member" }, { status: 400 });
            }

            // Add them directly
            const member = await prisma.roomMember.create({
                data: {
                    roomId: id,
                    userId: existingUser.id,
                    role: "member",
                },
                include: { user: true },
            });

            // Send notification email
            try {
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
                const roomLink = `${appUrl}/rooms/${id}`;
                await sendAddedToRoomEmail(
                    existingUser.email,
                    room.name,
                    roomLink,
                    session.user.name || "A team member"
                );
            } catch (emailError) {
                // Don't fail the request if email fails, just log it
                console.error("Failed to send added-to-room email:", emailError);
            }

            return NextResponse.json({ member, added: true }, { status: 201 });
        }

        // User doesn't exist - create invitation and send email
        try {
            // Check for existing pending invitation
            const existingInvitation = await prisma.roomInvitation.findUnique({
                where: { roomId_email: { roomId: id, email: email.toLowerCase().trim() } },
            });

            if (existingInvitation && existingInvitation.expiresAt > new Date()) {
                return NextResponse.json({ error: "Invitation already sent to this email" }, { status: 400 });
            }

            // Delete expired invitation if exists
            if (existingInvitation) {
                await prisma.roomInvitation.delete({
                    where: { id: existingInvitation.id },
                });
            }

            // Generate token first (before DB creation)
            const crypto = await import("crypto");
            const token = crypto.randomBytes(32).toString("hex");
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
            const inviteLink = `${appUrl}/invite/${token}`;

            // Send email FIRST - if this fails, we don't create the DB record
            await sendInviteEmail(
                email,
                inviteLink,
                room.name,
                session.user.name || "A team member"
            );

            // Only create invitation in DB after email succeeds
            await prisma.roomInvitation.create({
                data: {
                    roomId: id,
                    email: email.toLowerCase().trim(),
                    token,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                },
            });

            return NextResponse.json({ invited: true, email }, { status: 201 });
        } catch (error) {
            console.error("Failed to send invitation email:", error);
            return NextResponse.json(
                { error: "Failed to send invitation email. Please check SMTP configuration." },
                { status: 500 }
            );
        }
    }

    // If userId provided, add member directly (existing flow)
    if (userId) {
        const member = await prisma.roomMember.create({
            data: {
                roomId: id,
                userId,
                role: "member",
            },
        });

        return NextResponse.json({ member }, { status: 201 });
    }

    return NextResponse.json({ error: "Email or userId required" }, { status: 400 });
}

// DELETE: Remove member or leave room
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { id } = await params;
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const targetUserId = searchParams.get("userId") || session.user.id;

    // If removing self, just leave
    if (targetUserId === session.user.id) {
        await prisma.roomMember.delete({
            where: { roomId_userId: { roomId: id, userId: session.user.id } },
        });
        return NextResponse.json({ success: true });
    }

    // Otherwise, must be owner/admin
    const membership = await prisma.roomMember.findUnique({
        where: { roomId_userId: { roomId: id, userId: session.user.id } },
    });

    if (!membership || !["owner", "admin"].includes(membership.role)) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await prisma.roomMember.delete({
        where: { roomId_userId: { roomId: id, userId: targetUserId } },
    });

    return NextResponse.json({ success: true });
}

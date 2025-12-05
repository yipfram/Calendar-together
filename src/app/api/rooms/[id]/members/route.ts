import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type RouteParams = { params: Promise<{ id: string }> };

// POST: Join room with invite code
export async function POST(request: NextRequest, { params }: RouteParams) {
    const { id } = await params;
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { inviteCode, userId } = body;

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

    // Otherwise, add member by userId (owner/admin only)
    const membership = await prisma.roomMember.findUnique({
        where: { roomId_userId: { roomId: id, userId: session.user.id } },
    });

    if (!membership || !["owner", "admin"].includes(membership.role)) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const member = await prisma.roomMember.create({
        data: {
            roomId: id,
            userId,
            role: "member",
        },
    });

    return NextResponse.json({ member }, { status: 201 });
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

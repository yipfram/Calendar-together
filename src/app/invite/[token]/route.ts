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

type RouteParams = { params: Promise<{ token: string }> };

// GET: Handle magic link - redirect to appropriate page
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { token } = await params;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Find the invitation
    const invitation = await prisma.roomInvitation.findUnique({
        where: { token },
        include: { room: true },
    });

    if (!invitation) {
        return NextResponse.redirect(`${appUrl}/dashboard?error=invalid_invite`);
    }

    if (invitation.expiresAt < new Date()) {
        // Clean up expired invitation
        await prisma.roomInvitation.delete({ where: { id: invitation.id } });
        return NextResponse.redirect(`${appUrl}/dashboard?error=expired_invite`);
    }

    // Check if user is logged in
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        // Not logged in - redirect to sign-in with return url
        return NextResponse.redirect(
            `${appUrl}/sign-in?callbackUrl=${encodeURIComponent(`${appUrl}/invite/${token}`)}`
        );
    }

    // User is logged in - check if their email matches the invitation
    // (Allow joining even if email doesn't match - they clicked the link)

    // Check if already a member
    const existingMember = await prisma.roomMember.findUnique({
        where: { roomId_userId: { roomId: invitation.roomId, userId: session.user.id } },
    });

    if (existingMember) {
        // Already a member, just redirect to the room
        await prisma.roomInvitation.delete({ where: { id: invitation.id } });
        return NextResponse.redirect(`${appUrl}/rooms/${invitation.roomId}`);
    }

    // Add user to the room
    await prisma.roomMember.create({
        data: {
            roomId: invitation.roomId,
            userId: session.user.id,
            role: "member",
        },
    });

    // Delete the invitation
    await prisma.roomInvitation.delete({ where: { id: invitation.id } });

    // Redirect to the room
    return NextResponse.redirect(`${appUrl}/rooms/${invitation.roomId}?joined=true`);
}

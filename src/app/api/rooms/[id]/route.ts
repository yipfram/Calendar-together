import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { getFreeBusy, isCalendarConnected } from "@/lib/calendar";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type RouteParams = { params: Promise<{ id: string }> };

// GET: Get room details
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { id } = await params;
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check membership
    const membership = await prisma.roomMember.findUnique({
        where: { roomId_userId: { roomId: id, userId: session.user.id } },
    });

    if (!membership) {
        return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const room = await prisma.room.findUnique({
        where: { id },
        include: {
            members: true,
            proposals: {
                where: { status: "pending" },
                orderBy: { startTime: "asc" },
            },
        },
    });

    return NextResponse.json({ room });
}

// DELETE: Delete room (owner only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { id } = await params;
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const room = await prisma.room.findUnique({ where: { id } });

    if (!room || room.ownerId !== session.user.id) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await prisma.room.delete({ where: { id } });

    return NextResponse.json({ success: true });
}

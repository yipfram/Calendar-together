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

// GET: List user's rooms
export async function GET() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberships = await prisma.roomMember.findMany({
        where: { userId: session.user.id },
        include: { room: true },
    });

    const rooms = memberships.map((m) => ({
        ...m.room,
        role: m.role,
    }));

    return NextResponse.json({ rooms });
}

// POST: Create a new room
export async function POST(request: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const room = await prisma.room.create({
        data: {
            name,
            description,
            ownerId: session.user.id,
            members: {
                create: {
                    userId: session.user.id,
                    role: "owner",
                },
            },
        },
    });

    return NextResponse.json({ room }, { status: 201 });
}

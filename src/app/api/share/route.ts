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

// GET: List active share links
export async function GET(request: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const links = await prisma.availabilityShareLink.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ links });
    } catch (error) {
        console.error("Failed to list share links:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Create new share link
export async function POST(request: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, startDate, endDate, expiresAt, visibility, allowedEmails } = body;

        // Basic validation
        if (!startDate || !endDate) {
            return NextResponse.json({ error: "Start and End dates are required" }, { status: 400 });
        }

        const link = await prisma.availabilityShareLink.create({
            data: {
                userId: session.user.id,
                name: name || "My Availability",
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                visibility: visibility || "public",
                allowedEmails: allowedEmails || [],
            },
        });

        return NextResponse.json({ link });
    } catch (error) {
        console.error("Failed to create share link:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { getUserCalendars, isCalendarConnected } from "@/lib/calendar";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// GET: Get user's calendars and current selection
export async function GET() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connected = await isCalendarConnected(session.user.id);
    if (!connected) {
        return NextResponse.json({ error: "Calendar not connected" }, { status: 400 });
    }

    try {
        const calendars = await getUserCalendars(session.user.id);

        // Get current selection from DB
        const account = await prisma.calendarAccount.findUnique({
            where: { userId_provider: { userId: session.user.id, provider: "google" } },
        });

        return NextResponse.json({
            calendars,
            selectedCalendars: account?.selectedCalendars || [],
        });
    } catch (error) {
        console.error("Failed to get calendars:", error);
        return NextResponse.json({ error: "Failed to fetch calendars" }, { status: 500 });
    }
}

// POST: Save calendar selection
export async function POST(request: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { selectedCalendars } = body;

        if (!Array.isArray(selectedCalendars)) {
            return NextResponse.json({ error: "Invalid calendars" }, { status: 400 });
        }

        await prisma.calendarAccount.update({
            where: { userId_provider: { userId: session.user.id, provider: "google" } },
            data: { selectedCalendars },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to save calendars:", error);
        return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }
}

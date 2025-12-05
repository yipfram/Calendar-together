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

// GET: Get combined availability for all room members
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

    // Get all members who share their availability
    const members = await prisma.roomMember.findMany({
        where: { roomId: id, shareFreeBusy: true },
    });

    // Get time range from query params (default: next 7 days)
    const searchParams = request.nextUrl.searchParams;
    const timeMin = new Date(searchParams.get("timeMin") || Date.now());
    const timeMax = new Date(
        searchParams.get("timeMax") || Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    // Fetch busy slots for each member using their selected calendars
    const availability: Record<string, { start: string; end: string }[]> = {};

    for (const member of members) {
        const hasCalendar = await isCalendarConnected(member.userId);
        if (hasCalendar) {
            try {
                // Get user's calendar settings
                const account = await prisma.calendarAccount.findUnique({
                    where: { userId_provider: { userId: member.userId, provider: "google" } },
                });
                const selectedCalendars = account?.selectedCalendars || [];

                // Pass selected calendars (or empty for all)
                const busy = await getFreeBusy(member.userId, timeMin, timeMax, selectedCalendars.length > 0 ? selectedCalendars : undefined);
                availability[member.userId] = busy;
            } catch (error) {
                console.error(`Failed to get availability for ${member.userId}:`, error);
                availability[member.userId] = [];
            }
        } else {
            availability[member.userId] = [];
        }
    }

    return NextResponse.json({
        availability,
        start: timeMin.toISOString(),
        end: timeMax.toISOString(),
    });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserCalendars, isCalendarConnected } from "@/lib/calendar";

// GET: Get list of user's calendars
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
        return NextResponse.json({ calendars });
    } catch (error) {
        console.error("Failed to get calendars:", error);
        return NextResponse.json({ error: "Failed to fetch calendars" }, { status: 500 });
    }
}

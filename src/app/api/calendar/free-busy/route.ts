import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getFreeBusy, isCalendarConnected } from "@/lib/calendar";

export async function GET(request: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if calendar is connected
    const connected = await isCalendarConnected(userId);
    if (!connected) {
        return NextResponse.json(
            { error: "Calendar not connected" },
            { status: 400 }
        );
    }

    // Get time range from query params (default: next 7 days)
    const searchParams = request.nextUrl.searchParams;
    const timeMin = new Date(searchParams.get("timeMin") || Date.now());
    const timeMax = new Date(
        searchParams.get("timeMax") || Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    try {
        const busySlots = await getFreeBusy(userId, timeMin, timeMax);
        return NextResponse.json({ busy: busySlots });
    } catch (error) {
        console.error("Free/busy error:", error);
        return NextResponse.json(
            { error: "Failed to fetch availability" },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from "next/server";
import { handleCalendarCallback } from "@/lib/calendar";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // userId passed from auth URL

    if (!code || !state) {
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=missing_params`
        );
    }

    try {
        await handleCalendarCallback(code, state);
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?calendar=connected`
        );
    } catch (error) {
        console.error("Calendar callback error:", error);
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=connection_failed`
        );
    }
}

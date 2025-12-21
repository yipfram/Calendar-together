import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { getFreeBusy } from "@/lib/calendar";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
    const { token } = await params;

    try {
        // 1. Find the link
        const link = await prisma.availabilityShareLink.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!link || !link.active) {
            return NextResponse.json({ error: "Link not found or inactive" }, { status: 404 });
        }

        // 2. Check Expiration
        if (link.expiresAt && new Date() > link.expiresAt) {
            return NextResponse.json({ error: "Link expired" }, { status: 410 });
        }

        // 3. Check Visibility
        if (link.visibility !== "public") {
            const session = await auth.api.getSession({
                headers: await headers(),
            });

            if (!session?.user) {
                // Deliberately return 401 from this API; the frontend interprets this and performs any necessary redirects (e.g., to a login page).
                return NextResponse.json({ error: "Authentication required" }, { status: 401 });
            }

            if (link.visibility === "restricted") {
                if (!link.allowedEmails.includes(session.user.email)) {
                    return NextResponse.json({ error: "Access denied" }, { status: 403 });
                }
            }
        }

        // 4. Determine Time Range
        // Use link.startDate/endDate as hard bounds.
        // Client can request a subset, but cannot exceed these bounds.
        let timeMin = new Date(link.startDate);
        let timeMax = new Date(link.endDate);

        const searchParams = request.nextUrl.searchParams;
        const queryMin = searchParams.get("timeMin") ? new Date(searchParams.get("timeMin")!) : null;
        const queryMax = searchParams.get("timeMax") ? new Date(searchParams.get("timeMax")!) : null;

        if (queryMin && !isNaN(queryMin.getTime())) {
            if (queryMin > timeMin) timeMin = queryMin;
        }
        if (queryMax && !isNaN(queryMax.getTime())) {
            if (queryMax < timeMax) timeMax = queryMax; // Clamp to end
        }

        // Safety: ensure min < max
        if (timeMin >= timeMax) {
            // If query range is completely outside valid range, might be empty or error.
            // But if we clamped, timeMin might be > original timeMax if queryMin > original timeMax.
            // Let's just return empty if the intersected range is invalid
            return NextResponse.json({
                availability: {},
                user: { name: link.user.name, image: link.user.image },
                start: timeMin.toISOString(),
                end: timeMax.toISOString()
            });
        }

        // 5. Fetch Availability
        const account = await prisma.calendarAccount.findUnique({
            where: { userId_provider: { userId: link.userId, provider: "google" } },
        });
        const selectedCalendars = account?.selectedCalendars || [];

        const busy = await getFreeBusy(
            link.userId,
            timeMin,
            timeMax,
            selectedCalendars.length > 0 ? selectedCalendars : undefined
        );

        return NextResponse.json({
            availability: { [link.userId]: busy },
            user: {
                name: link.user.name,
                image: link.user.image
            },
            start: timeMin.toISOString(),
            end: timeMax.toISOString(),
            link: {
                name: link.name,
                startDate: link.startDate,
                endDate: link.endDate
            }
        });

    } catch (error) {
        console.error("Failed to fetch shared availability:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

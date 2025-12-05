import { google, calendar_v3 } from "googleapis";
import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/callback`
);

// Scopes for Google Calendar free/busy access
export const CALENDAR_SCOPES = [
    "https://www.googleapis.com/auth/calendar.freebusy",        // Own calendars
    "https://www.googleapis.com/auth/calendar.events.freebusy", // Shared calendars
];

export interface CalendarInfo {
    id: string;
    name: string;
    primary: boolean;
    backgroundColor?: string | null;
}

/**
 * Generate OAuth URL for calendar connection
 */
export function getCalendarAuthUrl(userId: string): string {
    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: CALENDAR_SCOPES,
        state: userId,
        prompt: "consent",
    });
}

/**
 * Exchange authorization code for tokens and store them
 */
export async function handleCalendarCallback(code: string, userId: string) {
    const { tokens } = await oauth2Client.getToken(code);

    await prisma.calendarAccount.upsert({
        where: { userId_provider: { userId, provider: "google" } },
        create: {
            userId,
            provider: "google",
            accessToken: tokens.access_token!,
            refreshToken: tokens.refresh_token,
            expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        },
        update: {
            accessToken: tokens.access_token!,
            refreshToken: tokens.refresh_token || undefined,
            expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        },
    });

    return tokens;
}

/**
 * Get authenticated calendar client for a user
 */
async function getCalendarClient(userId: string) {
    const account = await prisma.calendarAccount.findUnique({
        where: { userId_provider: { userId, provider: "google" } },
    });

    if (!account) {
        throw new Error("Calendar not connected");
    }

    const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );

    client.setCredentials({
        access_token: account.accessToken,
        refresh_token: account.refreshToken,
    });

    // Handle token refresh
    client.on("tokens", async (tokens) => {
        if (tokens.access_token) {
            await prisma.calendarAccount.update({
                where: { userId_provider: { userId, provider: "google" } },
                data: {
                    accessToken: tokens.access_token,
                    expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                },
            });
        }
    });

    return google.calendar({ version: "v3", auth: client });
}

/**
 * Get list of all calendars for a user
 */
export async function getUserCalendars(userId: string): Promise<CalendarInfo[]> {
    const calendar = await getCalendarClient(userId);

    const response = await calendar.calendarList.list();
    const items = response.data.items || [];

    return items.map((cal: calendar_v3.Schema$CalendarListEntry) => ({
        id: cal.id || "",
        name: cal.summary || "Unnamed Calendar",
        primary: cal.primary || false,
        backgroundColor: cal.backgroundColor,
    }));
}

/**
 * Fetch free/busy information for a user from selected calendars
 */
export async function getFreeBusy(
    userId: string,
    timeMin: Date,
    timeMax: Date,
    calendarIds?: string[] // Optional: specific calendars to check
): Promise<{ start: string; end: string }[]> {
    const calendar = await getCalendarClient(userId);

    // If no specific calendars, get all user calendars
    let calendarsToCheck = calendarIds;
    if (!calendarsToCheck || calendarsToCheck.length === 0) {
        const userCalendars = await getUserCalendars(userId);
        calendarsToCheck = userCalendars.map(c => c.id);
    }

    const response = await calendar.freebusy.query({
        requestBody: {
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            items: calendarsToCheck.map(id => ({ id })),
        },
    });

    // Combine busy slots from all calendars
    const allBusy: { start: string; end: string }[] = [];
    const calendars = response.data.calendars || {};

    for (const calId of Object.keys(calendars)) {
        const busySlots = calendars[calId]?.busy || [];
        for (const slot of busySlots) {
            allBusy.push({
                start: slot.start || "",
                end: slot.end || "",
            });
        }
    }

    // Sort and merge overlapping slots
    return mergeOverlappingSlots(allBusy);
}

/**
 * Merge overlapping busy slots
 */
function mergeOverlappingSlots(slots: { start: string; end: string }[]): { start: string; end: string }[] {
    if (slots.length === 0) return [];

    // Sort by start time
    const sorted = [...slots].sort((a, b) =>
        new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    const merged: { start: string; end: string }[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
        const current = sorted[i];
        const last = merged[merged.length - 1];

        if (new Date(current.start) <= new Date(last.end)) {
            // Overlapping, extend the end time
            last.end = new Date(current.end) > new Date(last.end) ? current.end : last.end;
        } else {
            merged.push(current);
        }
    }

    return merged;
}

/**
 * Check if user has connected their calendar
 */
export async function isCalendarConnected(userId: string): Promise<boolean> {
    const account = await prisma.calendarAccount.findUnique({
        where: { userId_provider: { userId, provider: "google" } },
    });
    return !!account;
}

import { google } from "googleapis";
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
    "https://www.googleapis.com/auth/calendar.readonly",
];

/**
 * Generate OAuth URL for calendar connection
 */
export function getCalendarAuthUrl(userId: string): string {
    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: CALENDAR_SCOPES,
        state: userId, // Pass userId to callback
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
 * Fetch free/busy information for a user
 */
export async function getFreeBusy(
    userId: string,
    timeMin: Date,
    timeMax: Date
): Promise<{ start: string; end: string }[]> {
    const calendar = await getCalendarClient(userId);

    const response = await calendar.freebusy.query({
        requestBody: {
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            items: [{ id: "primary" }],
        },
    });

    const busy = response.data.calendars?.primary?.busy || [];
    return busy.map((slot) => ({
        start: slot.start || "",
        end: slot.end || "",
    }));
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

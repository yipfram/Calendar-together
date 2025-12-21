import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Simple logger for auth events
const logAuthEvent = (level: "INFO" | "SUCCESS" | "ERROR", event: string, data?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    const details = data ? ` | ${JSON.stringify(data)}` : "";
    const emoji = level === "SUCCESS" ? "✅" : level === "ERROR" ? "❌" : "ℹ️";
    console.log(`[${timestamp}] [AUTH] ${emoji} [${level}] ${event}${details}`);
};

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    trustedOrigins: process.env.TRUSTED_ORIGINS?.split(",") || [
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    ],
    emailAndPassword: {
        enabled: false,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
    },
    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    logAuthEvent("INFO", "User signing up", { email: user.email, name: user.name });
                    return { data: user };
                },
                after: async (user) => {
                    logAuthEvent("SUCCESS", "User created in DB", { id: user.id, email: user.email, name: user.name });
                },
            },
        },
        session: {
            create: {
                after: async (session) => {
                    logAuthEvent("SUCCESS", "User signed in - session created", { userId: session.userId, sessionId: session.id });
                },
            },
        },
    },
    onAPIError: {
        onError: (error) => {
            const message = error instanceof Error ? error.message : String(error);
            logAuthEvent("ERROR", "Auth failed", { message });
        },
    },
});

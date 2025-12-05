"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function DashboardContent() {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [calendarStatus, setCalendarStatus] = useState<"idle" | "connected" | "error">("idle");

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/sign-in");
        }
    }, [session, isPending, router]);

    useEffect(() => {
        if (searchParams.get("calendar") === "connected") {
            setCalendarStatus("connected");
        } else if (searchParams.get("error")) {
            setCalendarStatus("error");
        }
    }, [searchParams]);

    if (isPending) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    const handleConnectCalendar = () => {
        window.location.href = "/api/calendar/connect";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <nav className="border-b border-white/10 backdrop-blur-xl bg-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <h1 className="text-xl font-bold text-white">Calendar Together</h1>
                        <div className="flex items-center gap-4">
                            <span className="text-white/80">{session.user?.email}</span>
                            <button
                                onClick={() => signOut()}
                                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <a
                        href="/rooms"
                        className="p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-2xl border border-purple-500/30 hover:border-purple-500/60 transition-all group"
                    >
                        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-400">
                            📅 My Rooms
                        </h3>
                        <p className="text-white/60">
                            Create groups and find the perfect time to meet.
                        </p>
                    </a>
                    <div className="p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
                        <h3 className="text-xl font-semibold text-white mb-2">
                            🔗 Connect Calendar
                        </h3>
                        <p className="text-white/60">
                            Share your availability with your groups.
                        </p>
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 mb-6">
                    <h2 className="text-2xl font-bold text-white mb-4">
                        Welcome, {session.user?.name || "User"}!
                    </h2>
                    <p className="text-white/60 mb-6">
                        Connect your Google Calendar to share your availability with friends.
                    </p>

                    {calendarStatus === "connected" && (
                        <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-xl">
                            <p className="text-green-400 flex items-center gap-2">
                                <span>✅</span> Calendar connected successfully!
                            </p>
                        </div>
                    )}

                    {calendarStatus === "error" && (
                        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                            <p className="text-red-400 flex items-center gap-2">
                                <span>❌</span> Failed to connect calendar. Please try again.
                            </p>
                        </div>
                    )}

                    <button
                        onClick={handleConnectCalendar}
                        className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.5 22h-15A2.5 2.5 0 012 19.5v-15A2.5 2.5 0 014.5 2h15A2.5 2.5 0 0122 4.5v15a2.5 2.5 0 01-2.5 2.5zM9 18v-6H7v6h2zm4 0v-8h-2v8h2zm4 0V8h-2v10h2z" />
                        </svg>
                        {calendarStatus === "connected" ? "Reconnect Calendar" : "Connect Google Calendar"}
                    </button>
                </div>

                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8">
                    <h3 className="text-xl font-semibold text-white mb-4">Your Availability</h3>
                    <p className="text-white/60">
                        {calendarStatus === "connected"
                            ? "Your calendar is connected. Availability will be shown here."
                            : "Connect your calendar to see your availability."}
                    </p>
                </div>
            </main>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}

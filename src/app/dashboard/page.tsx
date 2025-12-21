"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
// import { RoomsSkeleton } from "@/components/RoomsSkeleton"; // Deleting rooms usage
import { ShareAvailabilityModal } from "@/components/ShareAvailabilityModal";
import { Copy, Check } from "lucide-react";

interface Room {
    id: string;
    name: string;
    description?: string;
    inviteCode: string;
    role: string;
}

function DashboardContent() {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [calendarStatus, setCalendarStatus] = useState<"idle" | "connected" | "error">("idle");

    const [shareLinks, setShareLinks] = useState<any[]>([]);
    const [loadingLinks, setLoadingLinks] = useState(true);
    const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

    const copyShareLink = (token: string, id: string) => {
        const link = `${window.location.origin}/share/${token}`;
        navigator.clipboard.writeText(link);
        setCopiedLinkId(id);
        setTimeout(() => setCopiedLinkId(null), 2000);
    };

    const deleteLink = async (id: string, e: React.MouseEvent) => {
        e.preventDefault(); // Prevent bubbling if needed
        if (!confirm("Are you sure you want to delete this shared link? This action cannot be undone.")) return;

        try {
            const res = await fetch("/api/share", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            if (res.ok) {
                fetchLinks();
            } else {
                alert("Failed to delete link.");
            }
        } catch (error) {
            console.error("Failed to delete link:", error);
        }
    };

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

    useEffect(() => {
        if (session) {
            fetchLinks();
            checkCalendarConnection();
        }
    }, [session]);

    const checkCalendarConnection = async () => {
        try {
            const res = await fetch("/api/calendar/settings");
            if (res.ok) {
                setCalendarStatus("connected");
            }
        } catch (error) {
            console.error("Failed to check calendar connection:", error);
        }
    };

    const fetchLinks = async () => {
        try {
            const res = await fetch("/api/share");
            const data = await res.json();
            setShareLinks(data.links || []);
        } catch (error) {
            console.error("Failed to fetch share links:", error);
        } finally {
            setLoadingLinks(false);
        }
    };

    const handleConnectCalendar = () => {
        window.location.href = "/api/calendar/connect";
    };

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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Availability Management */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Create New Link Section */}
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-6">Manager</h2>
                            <div className="p-6 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-1">Share Availability</h3>
                                    <p className="text-white/60 text-sm max-w-md">
                                        Create a new link to share your free/busy status. manage access and expiration below.
                                    </p>
                                </div>
                                <ShareAvailabilityModal onLinkCreated={fetchLinks} />
                            </div>
                        </section>

                        {/* Active Links List */}
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-6">Active Shared Links</h2>
                            {loadingLinks ? (
                                <div className="space-y-4">
                                    {[1, 2].map(i => (
                                        <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse"></div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {shareLinks.length === 0 ? (
                                        <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                                            <p className="text-white/60">No active shared links. Create one above!</p>
                                        </div>
                                    ) : (
                                        shareLinks.map((link) => (
                                            <div
                                                key={link.id}
                                                className="p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 flex flex-col md:flex-row md:items-center justify-between gap-4"
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-lg font-semibold text-white">
                                                            {link.name || "Untitled Link"}
                                                        </h3>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${link.visibility === 'public' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                                                            link.visibility === 'authenticated' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                                                                'bg-orange-500/20 text-orange-300 border-orange-500/30'
                                                            }`}>
                                                            {link.visibility === 'public' ? 'Public' :
                                                                link.visibility === 'authenticated' ? 'Logged In' : 'Restricted'}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <p className="text-sm text-white/60">
                                                            <span className="text-white/40">Dates:</span>{" "}
                                                            {new Date(link.startDate).toLocaleDateString()} — {new Date(link.endDate).toLocaleDateString()}
                                                        </p>
                                                        {link.visibility === 'restricted' && link.allowedEmails?.length > 0 && (
                                                            <p className="text-sm text-white/60">
                                                                <span className="text-white/40">Access:</span>{" "}
                                                                {link.allowedEmails.join(", ")}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-white/40 mt-2">
                                                            Created {new Date(link.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => copyShareLink(link.token, link.id)}
                                                        className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-colors flex items-center gap-2 text-sm"
                                                        title="Copy Link"
                                                    >
                                                        {copiedLinkId === link.id ? (
                                                            <>
                                                                <Check className="w-4 h-4 text-green-400" />
                                                                <span className="text-green-400">Copied</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="w-4 h-4" />
                                                                <span>Copy</span>
                                                            </>
                                                        )}
                                                    </button>

                                                    <button
                                                        onClick={(e) => deleteLink(link.id, e)}
                                                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-colors text-sm px-4"
                                                        title="Delete Link"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right Column: Connect Calendar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 sticky top-8">
                            <h2 className="text-xl font-bold text-white mb-4">
                                Calendar Connection
                            </h2>
                            <p className="text-white/60 mb-6 text-sm">
                                Connect your Google Calendar to share your availability.
                            </p>

                            {calendarStatus === "connected" && (
                                <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-xl">
                                    <p className="text-green-400 text-sm flex items-center gap-2">
                                        <span>✅</span> Connected
                                    </p>
                                </div>
                            )}

                            {calendarStatus === "error" && (
                                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
                                    <p className="text-red-400 text-sm flex items-center gap-2">
                                        <span>❌</span> Connection failed
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={handleConnectCalendar}
                                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19.5 22h-15A2.5 2.5 0 012 19.5v-15A2.5 2.5 0 014.5 2h15A2.5 2.5 0 0122 4.5v15a2.5 2.5 0 01-2.5 2.5zM9 18v-6H7v6h2zm4 0v-8h-2v8h2zm4 0V8h-2v10h2z" />
                                </svg>
                                {calendarStatus === "connected" ? "Reconnect" : "Connect Google Calendar"}
                            </button>
                        </div>
                    </div>
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

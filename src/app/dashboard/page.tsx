"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { RoomsSkeleton } from "@/components/RoomsSkeleton";

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

    const [rooms, setRooms] = useState<Room[]>([]);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newRoomName, setNewRoomName] = useState("");
    const [inviteCode, setInviteCode] = useState("");

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
            fetchRooms();
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

    const fetchRooms = async () => {
        try {
            const res = await fetch("/api/rooms");
            const data = await res.json();
            setRooms(data.rooms || []);
        } catch (error) {
            console.error("Failed to fetch rooms:", error);
        } finally {
            setLoadingRooms(false);
        }
    };

    const createRoom = async () => {
        if (!newRoomName.trim()) return;

        try {
            const res = await fetch("/api/rooms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newRoomName }),
            });

            if (res.ok) {
                const data = await res.json();
                setNewRoomName("");
                setShowCreate(false);
                // Redirect to the newly created room
                if (data?.room?.id) {
                    router.push(`/rooms/${data.room.id}`);
                } else {
                    // Fallback: refresh room list if redirect fails
                    fetchRooms();
                }
            }
        } catch (error) {
            console.error("Failed to create room:", error);
        }
    };

    const joinRoom = async () => {
        if (!inviteCode.trim()) return;

        try {
            const res = await fetch("/api/rooms/join/members", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inviteCode }),
            });

            if (res.ok) {
                setInviteCode("");
                fetchRooms();
            }
        } catch (error) {
            console.error("Failed to join room:", error);
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
                    {/* Left Column: My Rooms */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">My Rooms</h2>
                            <button
                                onClick={() => setShowCreate(!showCreate)}
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all text-sm"
                            >
                                + Create Room
                            </button>
                        </div>

                        {/* Create Room Form */}
                        {showCreate && (
                            <div className="mb-6 p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
                                <h3 className="text-lg font-semibold text-white mb-4">Create New Room</h3>
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        value={newRoomName}
                                        onChange={(e) => setNewRoomName(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); createRoom(); } }}
                                        placeholder="Room name"
                                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <button
                                        onClick={createRoom}
                                        className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-all"
                                    >
                                        Create
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Join Room Input */}
                        <div className="mb-6 flex gap-2">
                             <input
                                type="text"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); joinRoom(); } }}
                                placeholder="Enter invite code to join"
                                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <button
                                onClick={joinRoom}
                                className="px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all"
                            >
                                Join
                            </button>
                        </div>

                        {/* Rooms List */}
                        {loadingRooms ? (
                            <RoomsSkeleton />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {rooms.map((room) => (
                                    <Link
                                        key={room.id}
                                        href={`/rooms/${room.id}`}
                                        className="p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-purple-500/50 transition-all group"
                                    >
                                        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                                            {room.name}
                                        </h3>
                                        {room.description && (
                                            <p className="text-white/60 mb-4 line-clamp-2">{room.description}</p>
                                        )}
                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full">
                                                {room.role}
                                            </span>
                                            <span className="text-white/40 text-sm">View →</span>
                                        </div>
                                    </Link>
                                ))}
                                {rooms.length === 0 && (
                                    <div className="col-span-full text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                                        <p className="text-white/60">No rooms yet. Create one or join with an invite code!</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Connect Calendar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 sticky top-8">
                            <h2 className="text-xl font-bold text-white mb-4">
                                Calendar Connection
                            </h2>
                            <p className="text-white/60 mb-6 text-sm">
                                Connect your Google Calendar to share your availability with your groups automatically.
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

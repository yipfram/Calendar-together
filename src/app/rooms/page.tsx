"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Room {
    id: string;
    name: string;
    description?: string;
    inviteCode: string;
    role: string;
}

export default function RoomsPage() {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newRoomName, setNewRoomName] = useState("");
    const [inviteCode, setInviteCode] = useState("");

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/sign-in");
        }
    }, [session, isPending, router]);

    useEffect(() => {
        if (session) {
            fetchRooms();
        }
    }, [session]);

    const fetchRooms = async () => {
        try {
            const res = await fetch("/api/rooms");
            const data = await res.json();
            setRooms(data.rooms || []);
        } catch (error) {
            console.error("Failed to fetch rooms:", error);
        } finally {
            setLoading(false);
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
                setNewRoomName("");
                setShowCreate(false);
                fetchRooms();
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

    if (isPending || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <nav className="border-b border-white/10 backdrop-blur-xl bg-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-6">
                            <Link href="/dashboard" className="text-xl font-bold text-white">
                                Calendar Together
                            </Link>
                            <span className="text-white/40">|</span>
                            <span className="text-white/80">Rooms</span>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Create / Join Section */}
                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => setShowCreate(!showCreate)}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
                    >
                        + Create Room
                    </button>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                            placeholder="Enter invite code"
                            className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                            onClick={joinRoom}
                            className="px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all"
                        >
                            Join
                        </button>
                    </div>
                </div>

                {/* Create Room Form */}
                {showCreate && (
                    <div className="mb-8 p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Create New Room</h3>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={newRoomName}
                                onChange={(e) => setNewRoomName(e.target.value)}
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

                {/* Rooms Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                <p className="text-white/60 mb-4">{room.description}</p>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full">
                                    {room.role}
                                </span>
                                <span className="text-white/40 text-sm">View →</span>
                            </div>
                        </Link>
                    ))}

                    {rooms.length === 0 && (
                        <div className="col-span-full text-center py-12">
                            <p className="text-white/60">No rooms yet. Create one or join with an invite code!</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BusySlot {
    start: string;
    end: string;
    userId: string;
}

interface RoomMember {
    id: string;
    userId: string;
    role: string;
    user: {
        id: string;
        name: string;
        email: string;
        image?: string;
    };
}

interface Room {
    id: string;
    name: string;
    description?: string;
    inviteCode: string;
    ownerId: string;
    members: RoomMember[];
}

const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
};

export default function RoomPage() {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const params = useParams();
    const roomId = params.id as string;

    const [room, setRoom] = useState<Room | null>(null);
    const [availability, setAvailability] = useState<Record<string, { start: string; end: string }[]>>({});
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [startDate, setStartDate] = useState(() => getMonday(new Date()));

    // Add Member Modal State
    const [showAddMember, setShowAddMember] = useState(false);
    const [memberEmail, setMemberEmail] = useState("");
    const [addingMember, setAddingMember] = useState(false);
    const [addMemberError, setAddMemberError] = useState("");
    const [addMemberSuccess, setAddMemberSuccess] = useState("");

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/sign-in");
        }
    }, [session, isPending, router]);

    useEffect(() => {
        if (session && roomId) {
            fetchRoom();
            fetchAvailability();
        }
    }, [session, roomId, startDate]);

    const fetchRoom = async () => {
        try {
            const res = await fetch(`/api/rooms/${roomId}`);
            if (res.ok) {
                const data = await res.json();
                setRoom(data.room);
            }
        } catch (error) {
            console.error("Failed to fetch room:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailability = async () => {
        try {
            const timeMin = new Date(startDate);
            const timeMax = new Date(timeMin);
            timeMax.setDate(timeMax.getDate() + 7);

            const res = await fetch(
                `/api/rooms/${roomId}/availability?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}`
            );
            if (res.ok) {
                const data = await res.json();
                setAvailability(data.availability);
            }
        } catch (error) {
            console.error("Failed to fetch availability:", error);
        }
    };

    const copyInviteLink = () => {
        if (room) {
            navigator.clipboard.writeText(room.inviteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const addMember = async () => {
        if (!memberEmail.trim()) return;

        setAddingMember(true);
        setAddMemberError("");
        setAddMemberSuccess("");

        try {
            const res = await fetch(`/api/rooms/${roomId}/members`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: memberEmail.trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                setAddMemberError(data.error || "Failed to add member");
                return;
            }

            if (data.added) {
                setAddMemberSuccess(`${memberEmail} has been added to the room!`);
                fetchRoom(); // Refresh member list
            } else if (data.invited) {
                setAddMemberSuccess(`Invitation sent to ${memberEmail}!`);
            }

            setMemberEmail("");
        } catch (error) {
            console.error("Failed to add member:", error);
            setAddMemberError("An unexpected error occurred");
        } finally {
            setAddingMember(false);
        }
    };

    const nextWeek = () => {
        const newDate = new Date(startDate);
        newDate.setDate(newDate.getDate() + 7);
        setStartDate(newDate);
    };

    const prevWeek = () => {
        const newDate = new Date(startDate);
        newDate.setDate(newDate.getDate() - 7);
        setStartDate(newDate);
    };

    const goToToday = () => {
        setStartDate(getMonday(new Date()));
    };

    // Get member by userId for displaying profile info
    const getMemberByUserId = (userId: string): RoomMember | undefined => {
        return room?.members.find((m) => m.userId === userId);
    };

    // Get busy slots with userId preserved
    const getAllBusySlotsWithUser = (): BusySlot[] => {
        const allSlots: BusySlot[] = [];
        Object.entries(availability).forEach(([userId, slots]) => {
            slots.forEach((slot) => {
                allSlots.push({ ...slot, userId });
            });
        });
        return allSlots;
    };

    if (isPending || loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!room) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <p className="text-muted-foreground">Room not found</p>
            </div>
        );
    }

    const days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        return date;
    });

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const allBusy = getAllBusySlotsWithUser();

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Header */}
            <header className="border-b bg-card/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="flex items-center justify-between h-14 px-4">
                    <div className="flex items-center gap-3">
                        <Link href="/rooms">
                            <Button variant="ghost" size="sm">← Back</Button>
                        </Link>
                        <h1 className="text-lg font-semibold truncate max-w-[200px] sm:max-w-none">{room.name}</h1>
                        <span className="hidden sm:inline text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                            {room.members.length} members
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddMember(true)}
                        >
                            + Add Member
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={copyInviteLink}
                        >
                            {copied ? "Copied!" : "Invite"}
                        </Button>
                    </div>
                </div>
            </header>

            {/* Add Member Modal */}
            {showAddMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-card border rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
                        <h2 className="text-xl font-semibold mb-4">Add Member</h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            Enter the email address of the person you want to add.
                            If they don't have an account, they'll receive an invitation.
                        </p>
                        <input
                            type="email"
                            value={memberEmail}
                            onChange={(e) => setMemberEmail(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addMember()}
                            placeholder="email@example.com"
                            className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-4"
                            disabled={addingMember}
                            autoFocus
                        />
                        {addMemberError && (
                            <p className="text-sm text-destructive mb-4">{addMemberError}</p>
                        )}
                        {addMemberSuccess && (
                            <p className="text-sm text-green-500 mb-4">{addMemberSuccess}</p>
                        )}
                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setShowAddMember(false);
                                    setMemberEmail("");
                                    setAddMemberError("");
                                    setAddMemberSuccess("");
                                }}
                                disabled={addingMember}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={addMember}
                                disabled={addingMember || !memberEmail.trim()}
                            >
                                {addingMember ? "Adding..." : "Add Member"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Week Navigation */}
            <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b">
                <Button variant="ghost" size="sm" onClick={prevWeek}>
                    ← Prev
                </Button>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={goToToday}>
                        Today
                    </Button>
                    <span className="text-sm font-medium">
                        {startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} — {days[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                </div>
                <Button variant="ghost" size="sm" onClick={nextWeek}>
                    Next →
                </Button>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto">
                <div className="flex min-w-max h-full">
                    {/* Time Column */}
                    <div className="sticky left-0 z-30 bg-background border-r w-14 flex-shrink-0">
                        <div className="h-12 border-b bg-muted/50"></div>
                        {hours.map((hour) => (
                            <div
                                key={hour}
                                className="h-12 text-[11px] text-muted-foreground text-right pr-2 pt-0 border-b border-border/30"
                            >
                                {hour.toString().padStart(2, '0')}:00
                            </div>
                        ))}
                    </div>

                    {/* Days */}
                    {days.map((day, dayIndex) => (
                        <div
                            key={dayIndex}
                            className={cn(
                                "flex-1 min-w-[120px] sm:min-w-[140px] border-r border-border/50 relative",
                                isToday(day) && "bg-primary/5"
                            )}
                        >
                            {/* Day Header */}
                            <div className={cn(
                                "sticky top-0 z-20 border-b h-12 flex flex-col items-center justify-center",
                                isToday(day) ? "bg-primary/10" : "bg-muted/50"
                            )}>
                                <span className={cn(
                                    "text-xs",
                                    isToday(day) ? "text-primary font-semibold" : "text-muted-foreground"
                                )}>
                                    {day.toLocaleDateString(undefined, { weekday: 'short' })}
                                </span>
                                <span className={cn(
                                    "text-sm font-medium",
                                    isToday(day) && "text-primary"
                                )}>
                                    {day.getDate()}
                                </span>
                            </div>

                            {/* Hour Grid */}
                            {hours.map((hour) => (
                                <div key={hour} className="h-12 border-b border-border/30"></div>
                            ))}

                            {/* Busy Blocks with Profile Pictures */}
                            {allBusy.map((slot, i) => {
                                const start = new Date(slot.start);
                                const end = new Date(slot.end);

                                const dayStart = new Date(day);
                                dayStart.setHours(0, 0, 0, 0);
                                const dayEnd = new Date(day);
                                dayEnd.setHours(23, 59, 59, 999);

                                if (end <= dayStart || start >= dayEnd) return null;

                                const effectiveStart = start < dayStart ? dayStart : start;
                                const effectiveEnd = end > dayEnd ? dayEnd : end;

                                const startMinutes = effectiveStart.getHours() * 60 + effectiveStart.getMinutes();
                                const durationMinutes = (effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60);

                                // h-12 = 3rem = 48px per hour
                                const top = 48 + (startMinutes / 60) * 48; // + header height
                                const height = (durationMinutes / 60) * 48;

                                const member = getMemberByUserId(slot.userId);
                                const userName = member?.user?.name || "Unknown";
                                const userImage = member?.user?.image;

                                return (
                                    <div
                                        key={`busy-${i}`}
                                        className="absolute left-1 right-1 bg-muted-foreground/20 border-l-2 border-muted-foreground/50 rounded-sm flex items-start gap-1 p-1 overflow-hidden group cursor-default"
                                        style={{
                                            top: `${top}px`,
                                            height: `${Math.max(height, 24)}px`,
                                        }}
                                        title={`${userName} is busy`}
                                    >
                                        {/* Profile Picture */}
                                        {userImage ? (
                                            <img
                                                src={userImage}
                                                alt={userName}
                                                className="w-5 h-5 rounded-full flex-shrink-0 ring-1 ring-background"
                                            />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full bg-primary/30 flex items-center justify-center text-[10px] font-medium flex-shrink-0 ring-1 ring-background">
                                                {userName.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        {/* Name (show on wider blocks) */}
                                        {height >= 30 && (
                                            <span className="text-[10px] text-muted-foreground truncate">
                                                {userName}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="border-t bg-card/50 px-4 py-2 flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-muted-foreground/20 border-l-2 border-muted-foreground/50 rounded-sm"></div>
                    <span className="text-muted-foreground">Busy</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-background border border-border rounded-sm"></div>
                    <span className="text-muted-foreground">Available</span>
                </div>
            </div>
        </div>
    );
}

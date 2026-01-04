"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface BusySlot {
    start: string;
    end: string;
    userId: string;
}

interface ShareData {
    availability: Record<string, { start: string; end: string }[]>;
    user: {
        name: string;
        image?: string;
    };
    start: string;
    end: string;
    link: {
        name: string;
        startDate: string;
        endDate: string;
    };
    error?: string;
}

const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
};

export default function SharedAvailabilityPage() {
    const params = useParams();
    const token = params.token as string;

    const [data, setData] = useState<ShareData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [startDate, setStartDate] = useState(() => getMonday(new Date()));
    const isFirstLoadRef = useRef(true);

    const fetchAvailability = useCallback(async () => {
        try {
            // Fetch availability for the current view week
            const timeMin = new Date(startDate);
            const timeMax = new Date(timeMin);
            timeMax.setDate(timeMax.getDate() + 7);

            const res = await fetch(
                `/api/share/${token}?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}`
            );
            const jsonData = await res.json();

            if (res.ok) {
                setData(jsonData);
                // Initialize start date to the link's start date (aligned to Monday) if accessing for first time
                // But we need to handle this carefully to not reset on every fetch if we want state persistence?
                // Actually, if we fetch based on `startDate`, we need to set `startDate` once we know the link bounds.
                // However, we fetch *based* on start date. Chicken and egg if we don't know bounds.
                // Correct approach: First fetch gets the bounds. Then we align.

                // If it's the first load, align view to the link start
                if (isFirstLoadRef.current) {
                    const linkStart = new Date(jsonData.link.startDate);
                    setStartDate(getMonday(linkStart));
                    isFirstLoadRef.current = false;
                    // Scroll to 9 AM after a brief delay to let the DOM render
                    setTimeout(() => document.getElementById('hour-9')?.scrollIntoView({ behavior: 'instant', block: 'start' }), 100);
                }
            } else {
                if (res.status === 401) {
                    // Redirect to login
                    const currentUrl = window.location.href;
                    window.location.href = `/sign-in?callbackUrl=${encodeURIComponent(currentUrl)}`;
                    return;
                }
                setError(jsonData.error || "Failed to load availability");
            }
        } catch (err) {
            console.error("Failed to fetch availability:", err);
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    }, [token, startDate]);

    useEffect(() => {
        if (token) {
            fetchAvailability();
        }
    }, [token, startDate, fetchAvailability]);

    const nextWeek = () => {
        if (!data) return;
        const newDate = new Date(startDate);
        newDate.setDate(newDate.getDate() + 7);
        // Don't go past end date? actually API handles data, UI just limits nav button
        setStartDate(newDate);
    };

    const prevWeek = () => {
        if (!data) return;
        const newDate = new Date(startDate);
        newDate.setDate(newDate.getDate() - 7);
        setStartDate(newDate);
    };

    const goToToday = () => {
        setStartDate(getMonday(new Date()));
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-950 text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Unavailable</h1>
                    <p className="text-slate-400">{error || "Link invalid or expired"}</p>
                </div>
            </div>
        );
    }

    const { user, availability, link } = data;

    // Navigation constraints
    const linkStart = new Date(link.startDate);
    const linkEnd = new Date(link.endDate);

    // Current weekly view range (Monday–Sunday)
    const currentViewStart = startDate; // Monday
    const currentViewEnd = new Date(startDate);
    currentViewEnd.setDate(currentViewEnd.getDate() + 6); // Sunday

    // Navigation boundaries:
    // - "Previous week" is enabled when the end of the previous week
    //   (Sunday of the week before the current view) is on or after the
    //   overall link start date.
    const prevWeekEnd = new Date(startDate);
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 1); // Sunday of previous week
    const canGoPrev = prevWeekEnd >= linkStart;

    // - "Next week" is enabled when the start of the next week
    //   (Monday following the current view) is on or before the
    //   overall link end date.
    const nextWeekStart = new Date(startDate);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    const canGoNext = nextWeekStart <= linkEnd;

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

    // Flatten slots (though mostly single user)
    const allBusy: BusySlot[] = [];
    Object.entries(availability).forEach(([uid, slots]) => {
        slots.forEach((slot) => {
            allBusy.push({ ...slot, userId: uid });
        });
    });

    return (
        <div className="h-screen flex flex-col bg-slate-950 text-slate-100">
            {/* Header */}
            <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="flex items-center justify-between h-16 px-6">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            {link?.name || "Shared Availability"}
                        </h1>
                        <span className="text-sm text-slate-400 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                            {user.name}
                        </span>
                    </div>
                    <div>
                        <a href="/" className="text-sm text-purple-400 hover:text-purple-300 font-medium">
                            Create your own →
                        </a>
                    </div>
                </div>
            </header>

            {/* Week Navigation */}
            <div className="flex items-center justify-between px-6 py-3 bg-white/5 border-b border-white/10">
                <button
                    onClick={prevWeek}
                    disabled={!canGoPrev}
                    className={cn(
                        "px-3 py-1.5 rounded-lg text-sm transition-colors",
                        canGoPrev ? "hover:bg-white/10" : "opacity-30 cursor-not-allowed"
                    )}
                >
                    ← Prev
                </button>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium ml-2">
                        {startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} — {days[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                </div>
                <button
                    onClick={nextWeek}
                    disabled={!canGoNext}
                    className={cn(
                        "px-3 py-1.5 rounded-lg text-sm transition-colors",
                        canGoNext ? "hover:bg-white/10" : "opacity-30 cursor-not-allowed"
                    )}
                >
                    Next →
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                <div className="flex min-w-[800px]">
                    {/* Time Column */}
                    <div className="sticky left-0 z-30 bg-slate-950 border-r border-white/10 w-16 flex-shrink-0">
                        <div className="h-12 border-b border-white/10 bg-slate-900/50"></div>
                        {hours.map((hour) => (
                            <div
                                key={hour}
                                id={hour === 9 ? 'hour-9' : undefined}
                                className="h-12 text-[11px] text-slate-500 text-right pr-2 pt-1 border-b border-white/5"
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
                                "flex-1 min-w-[120px] border-r border-white/10 relative",
                                isToday(day) && "bg-purple-500/5"
                            )}
                        >
                            {/* Day Header */}
                            <div className={cn(
                                "sticky top-0 z-20 border-b border-white/10 h-12 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur",
                                isToday(day) && "border-b-purple-500"
                            )}>
                                <span className={cn(
                                    "text-xs uppercase tracking-wider",
                                    isToday(day) ? "text-purple-400 font-bold" : "text-slate-500"
                                )}>
                                    {day.toLocaleDateString(undefined, { weekday: 'short' })}
                                </span>
                                <span className={cn(
                                    "text-lg",
                                    isToday(day) ? "text-white font-bold" : "text-slate-400"
                                )}>
                                    {day.getDate()}
                                </span>
                            </div>

                            {/* Hour Grid */}
                            {hours.map((hour) => (
                                <div key={hour} className="h-12 border-b border-white/5"></div>
                            ))}

                            {/* Busy Blocks */}
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

                                return (
                                    <div
                                        key={`busy-${i}`}
                                        className="absolute left-1 right-1 bg-red-500/20 border-l-2 border-red-500 rounded-r-md flex items-center justify-center overflow-hidden"
                                        style={{
                                            top: `${top}px`,
                                            height: `${Math.max(height, 20)}px`,
                                        }}
                                        title="Busy"
                                    >
                                        <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">Busy</span>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

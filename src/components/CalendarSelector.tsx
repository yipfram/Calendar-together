"use client";

import { useState, useEffect, useCallback } from "react";
import { Check } from "lucide-react";

interface CalendarInfo {
    id: string;
    name: string;
    primary: boolean;
    backgroundColor?: string | null;
}

interface CalendarSelectorProps {
    className?: string;
}

export function CalendarSelector({ className }: CalendarSelectorProps) {
    const [calendars, setCalendars] = useState<CalendarInfo[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch calendars and current selection
    useEffect(() => {
        async function fetchCalendars() {
            try {
                const res = await fetch("/api/calendar/settings");
                if (!res.ok) throw new Error("Failed to fetch calendars");

                const data = await res.json();
                setCalendars(data.calendars || []);

                // If no selection saved, default to all calendars selected
                const saved = data.selectedCalendars || [];
                if (saved.length > 0) {
                    setSelectedIds(new Set(saved));
                } else {
                    // Default: all calendars selected
                    setSelectedIds(new Set((data.calendars || []).map((c: CalendarInfo) => c.id)));
                }
            } catch (err) {
                setError("Could not load calendars");
            } finally {
                setLoading(false);
            }
        }
        fetchCalendars();
    }, []);

    // Save selection with debounce
    const saveSelection = useCallback(async (ids: Set<string>) => {
        setSaving(true);
        try {
            await fetch("/api/calendar/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ selectedCalendars: Array.from(ids) }),
            });
        } catch (err) {
            console.error("Failed to save calendar selection:", err);
        } finally {
            setSaving(false);
        }
    }, []);

    const toggleCalendar = (calendarId: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(calendarId)) {
                next.delete(calendarId);
            } else {
                next.add(calendarId);
            }
            // Auto-save after toggle
            saveSelection(next);
            return next;
        });
    };

    if (loading) {
        return (
            <div className={className}>
                <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={className}>
                <p className="text-red-400 text-sm">{error}</p>
            </div>
        );
    }

    if (calendars.length === 0) {
        return (
            <div className={className}>
                <p className="text-white/60 text-sm">No calendars found</p>
            </div>
        );
    }

    return (
        <div className={className}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white/80">
                    Calendars for Availability
                </h3>
                {saving && (
                    <span className="text-xs text-white/40">Saving...</span>
                )}
            </div>
            <p className="text-xs text-white/50 mb-4">
                Uncheck calendars that shouldn't affect your availability (e.g., holidays).
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {calendars.map(calendar => (
                    <label
                        key={calendar.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors group"
                    >
                        <button
                            type="button"
                            onClick={() => toggleCalendar(calendar.id)}
                            className={`
                                w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
                                ${selectedIds.has(calendar.id)
                                    ? "bg-purple-500 border-purple-500"
                                    : "border-white/30 group-hover:border-white/50"
                                }
                            `}
                        >
                            {selectedIds.has(calendar.id) && (
                                <Check className="w-3 h-3 text-white" />
                            )}
                        </button>
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            {calendar.backgroundColor && (
                                <span
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: calendar.backgroundColor }}
                                />
                            )}
                            <span className="text-sm text-white/90 truncate">
                                {calendar.name}
                            </span>
                            {calendar.primary && (
                                <span className="text-xs text-purple-400 flex-shrink-0">Primary</span>
                            )}
                        </div>
                    </label>
                ))}
            </div>
        </div>
    );
}

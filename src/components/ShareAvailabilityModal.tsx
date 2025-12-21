"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, Copy, Loader2, Check } from "lucide-react";

export function ShareAvailabilityModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState("");
    const [copied, setCopied] = useState(false);

    // Form inputs
    const [duration, setDuration] = useState("14"); // Default 2 weeks
    const [visibility, setVisibility] = useState("public");
    const [isCustom, setIsCustom] = useState(false);
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");

    const generateLink = async () => {
        setLoading(true);
        try {
            let start = new Date();
            let end = new Date();

            if (isCustom && customStartDate && customEndDate) {
                start = new Date(customStartDate);
                end = new Date(customEndDate);
            } else {
                end.setDate(start.getDate() + parseInt(duration));
            }

            const res = await fetch("/api/share", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: "Quick Share",
                    startDate: start.toISOString(),
                    endDate: end.toISOString(),
                    visibility,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                const link = `${window.location.origin}/share/${data.link.token}`;
                setGeneratedLink(link);
            }
        } catch (error) {
            console.error("Failed to generate link:", error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const reset = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            // Reset state when closing (optional, or keep history)
            setTimeout(() => {
                setGeneratedLink("");
                setCopied(false);
            }, 300);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={reset}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg hover:shadow-purple-500/25 transition-all">
                    Share Availability
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-slate-900 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl">Share your availability</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Create a link to let others see when you are busy. They won't see details of your events.
                    </DialogDescription>
                </DialogHeader>

                {!generatedLink ? (
                    <div className="space-y-6 py-4">
                        {/* Simple Duration Selector */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-200">Duration</Label>
                            <Select
                                value={isCustom ? "custom" : duration}
                                onValueChange={(v) => {
                                    if (v === "custom") setIsCustom(true);
                                    else {
                                        setIsCustom(false);
                                        setDuration(v);
                                    }
                                }}
                            >
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                    <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                    <SelectItem value="7">Next 7 Days</SelectItem>
                                    <SelectItem value="14">Next 2 Weeks</SelectItem>
                                    <SelectItem value="30">Next 30 Days</SelectItem>
                                    <SelectItem value="custom">Custom Date Range...</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Custom Dates */}
                        {isCustom && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Start Date</Label>
                                    <Input
                                        type="date"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        className="bg-white/5 border-white/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">End Date</Label>
                                    <Input
                                        type="date"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        className="bg-white/5 border-white/10"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Visibility (Hidden by default for simple flow, can enable if needed) */}
                        {/* For MVP let's keep it simple: defaulting to 'public' as per plan, maybe an advanced toggle later */}

                        <Button
                            onClick={generateLink}
                            disabled={loading || (isCustom && (!customStartDate || !customEndDate))}
                            className="w-full bg-white text-slate-900 hover:bg-slate-200 font-bold"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Link
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                            <h3 className="text-green-400 font-semibold mb-1">Link Ready!</h3>
                            <p className="text-xs text-slate-400">Anyone with this link can view your availability.</p>
                        </div>

                        <div className="flex items-center gap-2 p-2 bg-black/30 rounded-lg border border-white/10">
                            <code className="flex-1 text-xs truncate text-slate-300 font-mono pl-2">
                                {generatedLink}
                            </code>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={copyToClipboard}
                                className={copied ? "text-green-400" : "text-white"}
                            >
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>

                        <Button variant="outline" onClick={() => setGeneratedLink("")} className="w-full border-white/10 hover:bg-white/5 hover:text-white">
                            Create Another
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

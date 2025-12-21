"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Loader2, Check } from "lucide-react";

export function ShareAvailabilityModal({ onLinkCreated }: { onLinkCreated?: () => void }) {
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
    const [restrictedEmails, setRestrictedEmails] = useState("");
    const [emailError, setEmailError] = useState("");

    const validateEmails = (input: string): boolean => {
        if (!input.trim()) return true; // Empty is fine (handled by logic below if required, but here we assume if empty -> no restricted emails? or error?) 
        // Actually if restricted is selected, we probably want at least one email.
        const emails = input.split(",").map(e => e.trim()).filter(e => e);
        if (emails.length === 0) return false;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emails.every(email => emailRegex.test(email));
    };

    const generateLink = async () => {
        setEmailError("");
        let allowedEmails: string[] = [];

        if (visibility === "restricted") {
            if (!restrictedEmails.trim()) {
                setEmailError("Please enter at least one email address");
                return;
            }
            if (!validateEmails(restrictedEmails)) {
                setEmailError("Please ensure all email addresses are valid");
                return;
            }
            allowedEmails = restrictedEmails.split(",").map(e => e.trim()).filter(e => e);
        }

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
                    allowedEmails
                }),
            });

            if (res.ok) {
                const data = await res.json();
                const link = `${window.location.origin}/share/${data.link.token}`;
                setGeneratedLink(link);
                if (onLinkCreated) onLinkCreated();
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
    };

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

                        {/* Visibility Selector */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium text-slate-200">Who can view this?</Label>
                            <div className="flex flex-col gap-3">
                                <label className="flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                                    <input
                                        type="radio"
                                        name="visibility"
                                        value="public"
                                        checked={visibility === "public"}
                                        onChange={(e) => setVisibility(e.target.value)}
                                        className="mt-1"
                                    />
                                    <div>
                                        <div className="text-sm font-medium text-white">Public</div>
                                        <div className="text-xs text-slate-400">Anyone with the link can view</div>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                                    <input
                                        type="radio"
                                        name="visibility"
                                        value="authenticated"
                                        checked={visibility === "authenticated"}
                                        onChange={(e) => setVisibility(e.target.value)}
                                        className="mt-1"
                                    />
                                    <div>
                                        <div className="text-sm font-medium text-white">Authenticated Users</div>
                                        <div className="text-xs text-slate-400">Any logged-in user</div>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                                    <input
                                        type="radio"
                                        name="visibility"
                                        value="restricted"
                                        checked={visibility === "restricted"}
                                        onChange={(e) => setVisibility(e.target.value)}
                                        className="mt-1"
                                    />
                                    <div>
                                        <div className="text-sm font-medium text-white">Restricted</div>
                                        <div className="text-xs text-slate-400">Specific people only (by email)</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Restricted Emails Input */}
                        {visibility === "restricted" && (
                            <div className="space-y-2">
                                <Label className="text-xs">Allowed Emails (comma separated)</Label>
                                <Input
                                    placeholder="friend@example.com, colleague@work.com"
                                    className={`bg-white/5 border-white/10 ${emailError ? "border-red-500/50 focus:ring-red-500" : ""}`}
                                    value={restrictedEmails}
                                    onChange={(e) => {
                                        setRestrictedEmails(e.target.value);
                                        if (emailError) setEmailError("");
                                    }}
                                    id="allowed-emails"
                                />
                                {emailError ? (
                                    <p className="text-[10px] text-red-400 font-medium">
                                        {emailError}
                                    </p>
                                ) : (
                                    <p className="text-[10px] text-slate-400">
                                        Only users with these emails can access the link.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Custom Dates */}
                        {(isCustom || duration === "custom") && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Start Date</Label>
                                    <Input
                                        type="date"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        className="bg-white/5 border-white/10"
                                        min={new Date().toISOString().split("T")[0]}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">End Date</Label>
                                    <Input
                                        type="date"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        className="bg-white/5 border-white/10"
                                        min={customStartDate || new Date().toISOString().split("T")[0]}
                                    />
                                </div>
                            </div>
                        )}

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
                            <h3 className="text-green-400 font-semibold mb-1">
                                {visibility === "public" ? "Public Link Ready!" : "Secure Link Created!"}
                            </h3>
                            <p className="text-xs text-slate-400">
                                {visibility === "public"
                                    ? "Anyone with this link can view your availability."
                                    : "Only authorized users can access this link."}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Input
                                readOnly
                                value={generatedLink}
                                className="flex-1 bg-black/30 border-white/10 text-slate-300 font-mono text-xs h-10 select-all"
                            />
                            <Button
                                size="icon"
                                variant="outline"
                                onClick={copyToClipboard}
                                className={`h-10 w-10 border-white/10 bg-white/5 hover:bg-white/10 ${copied ? "text-green-400 border-green-500/50" : "text-white"}`}
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

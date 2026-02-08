"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, Switch, Button, Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui";
import { Repeat, Plus, Trash2, Loader2, Clock } from "lucide-react";
import { AvailabilityPattern } from "@/types/database";

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const shortDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const timeSlots = [
    "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"
];

export default function RecurringPatterns() {
    const [patterns, setPatterns] = useState<AvailabilityPattern[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [adding, setAdding] = useState(false);

    // New pattern state
    const [newName, setNewName] = useState("");
    const [newDays, setNewDays] = useState<number[]>([]);
    const [newStartTime, setNewStartTime] = useState("09:00");
    const [newDuration, setNewDuration] = useState(60);

    useEffect(() => {
        fetchPatterns();
    }, []);

    const fetchPatterns = async () => {
        try {
            const response = await fetch("/api/availability/patterns");
            const result = await response.json();
            if (result.data) setPatterns(result.data);
        } catch (error) {
            console.error("Error fetching patterns:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePattern = async (id: string, currentStatus: boolean) => {
        // Optimistic update
        setPatterns(prev => prev.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p));

        try {
            const response = await fetch("/api/availability/patterns", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, is_active: !currentStatus }),
            });
            if (!response.ok) {
                // Revert on failure
                setPatterns(prev => prev.map(p => p.id === id ? { ...p, is_active: currentStatus } : p));
            } else {
                // Ideally refresh main schedule here
                window.location.reload(); // Simple brute force refresh for now to update main schedule slots
            }
        } catch (error) {
            console.error("Error toggling pattern:", error);
        }
    };

    const handleDeletePattern = async (id: string) => {
        if (!confirm("Are you sure you want to delete this pattern? All generated slots will be removed.")) return;

        try {
            const response = await fetch(`/api/availability/patterns?id=${id}`, {
                method: "DELETE",
            });
            if (response.ok) {
                setPatterns(prev => prev.filter(p => p.id !== id));
                window.location.reload();
            }
        } catch (error) {
            console.error("Error deleting pattern:", error);
        }
    };

    const handleAddPattern = async () => {
        if (!newName || newDays.length === 0) return;
        setAdding(true);
        try {
            const response = await fetch("/api/availability/patterns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newName,
                    days_of_week: newDays,
                    start_time: newStartTime,
                    duration_minutes: newDuration,
                    is_active: true
                }),
            });

            const result = await response.json();
            if (result.data) {
                setPatterns(prev => [...prev, result.data]);
                setShowDialog(false);
                setNewName("");
                setNewDays([]);
                window.location.reload(); // Refresh to show generated slots
            }
        } catch (error) {
            console.error("Error adding pattern:", error);
        } finally {
            setAdding(false);
        }
    };

    const toggleDay = (dayIndex: number) => {
        if (newDays.includes(dayIndex)) {
            setNewDays(prev => prev.filter(d => d !== dayIndex));
        } else {
            setNewDays(prev => [...prev, dayIndex].sort());
        }
    };

    return (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                            <Repeat className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">Recurring Slots</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Set patterns that repeat every week.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-4 text-slate-500">Loading...</div>
                        ) : patterns.length === 0 ? (
                            <p className="text-sm text-slate-500 italic block mb-2">No patterns created yet.</p>
                        ) : (
                            patterns.map((pattern) => (
                                <div key={pattern.id} className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-slate-900 dark:text-white">{pattern.name}</span>
                                        <span className="text-xs text-slate-500">
                                            {pattern.days_of_week.map(d => shortDays[d]).join("/")} at {pattern.start_time.slice(0, 5)}
                                            ({pattern.duration_minutes / 60}h blocks)
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={pattern.is_active}
                                            onCheckedChange={() => handleTogglePattern(pattern.id, pattern.is_active)}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeletePattern(pattern.id)}
                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <Dialog open={showDialog} onOpenChange={setShowDialog}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full mt-2 border-slate-300 dark:border-slate-700">
                                <Plus className="h-4 w-4 mr-2" /> Add Recurring Pattern
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Create Recurring Pattern</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">Pattern Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Morning Classes"
                                        className="p-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">Days</label>
                                    <div className="flex flex-wrap gap-2">
                                        {shortDays.map((day, index) => (
                                            <button
                                                key={day}
                                                onClick={() => toggleDay(index)}
                                                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${newDays.includes(index)
                                                    ? "bg-emerald-600 text-white"
                                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200"
                                                    }`}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium">Start Time</label>
                                        <select
                                            className="p-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
                                            value={newStartTime}
                                            onChange={(e) => setNewStartTime(e.target.value)}
                                        >
                                            {timeSlots.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium">Duration</label>
                                        <select
                                            className="p-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
                                            value={newDuration}
                                            onChange={(e) => setNewDuration(parseInt(e.target.value))}
                                        >
                                            <option value={30}>30 min</option>
                                            <option value={45}>45 min</option>
                                            <option value={60}>1 hour</option>
                                            <option value={90}>1.5 hours</option>
                                            <option value={120}>2 hours</option>
                                            <option value={180}>3 hours</option>
                                        </select>
                                    </div>
                                </div>

                                <Button onClick={handleAddPattern} disabled={adding} className="bg-emerald-600 hover:bg-emerald-700 text-white mt-4">
                                    {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Pattern"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardContent>
        </Card>
    );
}

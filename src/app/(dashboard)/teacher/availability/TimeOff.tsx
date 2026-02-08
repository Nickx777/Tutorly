"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, Button, Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui";
import { Calendar, Trash2, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { TeacherTimeOff } from "@/types/database";

export default function TimeOff() {
    const [timeOffs, setTimeOffs] = useState<TeacherTimeOff[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTimeOff, setNewTimeOff] = useState({ startDate: "", endDate: "", reason: "" });
    const [adding, setAdding] = useState(false);
    const [showDialog, setShowDialog] = useState(false);

    useEffect(() => {
        fetchTimeOff();
    }, []);

    const fetchTimeOff = async () => {
        try {
            const response = await fetch("/api/availability/time-off");
            const result = await response.json();
            if (result.data) setTimeOffs(result.data);
        } catch (error) {
            console.error("Error fetching time off:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTimeOff = async () => {
        if (!newTimeOff.startDate || !newTimeOff.endDate) return;
        setAdding(true);
        try {
            const response = await fetch("/api/availability/time-off", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    start_date: newTimeOff.startDate,
                    end_date: newTimeOff.endDate,
                    reason: newTimeOff.reason
                }),
            });

            const result = await response.json();
            if (result.data) {
                setTimeOffs(prev => [...prev, result.data].sort((a, b) => a.start_date.localeCompare(b.start_date)));
                setShowDialog(false);
                setNewTimeOff({ startDate: "", endDate: "", reason: "" });
            }
        } catch (error) {
            console.error("Error adding time off:", error);
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/availability/time-off?id=${id}`, {
                method: "DELETE",
            });
            if (response.ok) {
                setTimeOffs(prev => prev.filter(t => t.id !== id));
            }
        } catch (error) {
            console.error("Error deleting time off:", error);
        }
    };

    return (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">Time Off</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Block dates when you are unavailable.</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            <div className="text-center py-4 text-slate-500">Loading...</div>
                        ) : timeOffs.length === 0 ? (
                            <p className="text-sm text-slate-500 italic">No time off added yet.</p>
                        ) : (
                            timeOffs.map((timeOff) => (
                                <div key={timeOff.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-slate-900 dark:text-white">
                                            {format(new Date(timeOff.start_date), "MMM d, yyyy")}
                                            {timeOff.start_date !== timeOff.end_date && ` - ${format(new Date(timeOff.end_date), "MMM d, yyyy")}`}
                                        </span>
                                        {timeOff.reason && <span className="text-xs text-slate-500">{timeOff.reason}</span>}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(timeOff.id)}
                                        className="text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    <Dialog open={showDialog} onOpenChange={setShowDialog}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full mt-2 border-slate-300 dark:border-slate-700">
                                <Plus className="h-4 w-4 mr-2" /> Add Time Off
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Add Time Off</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium">Start Date</label>
                                        <input
                                            type="date"
                                            className="p-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
                                            value={newTimeOff.startDate}
                                            onChange={(e) => setNewTimeOff(p => ({ ...p, startDate: e.target.value }))}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium">End Date</label>
                                        <input
                                            type="date"
                                            className="p-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
                                            value={newTimeOff.endDate}
                                            onChange={(e) => setNewTimeOff(p => ({ ...p, endDate: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">Reason (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Vacation"
                                        className="p-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
                                        value={newTimeOff.reason}
                                        onChange={(e) => setNewTimeOff(p => ({ ...p, reason: e.target.value }))}
                                    />
                                </div>
                                <Button onClick={handleAddTimeOff} disabled={adding} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                    {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Block"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardContent>
        </Card>
    );
}

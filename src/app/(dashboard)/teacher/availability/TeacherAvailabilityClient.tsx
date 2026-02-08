"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Clock, Plus, Trash2, AlertCircle, Loader2, Calendar as CalendarIcon, Users, CalendarCheck, X, Repeat, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import RecurringPatterns from "./RecurringPatterns";
import BufferSettings from "./BufferSettings";
import TimeOff from "./TimeOff";
import Link from "next/link";

const timeSlots = [
    "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
    "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"
];

const durations = [30, 45, 60, 90, 120];

interface DateAvailabilitySlot {
    id: string;
    available_date: string;
    start_time: string;
    end_time: string;
    lesson_type: "one_on_one" | "group";
    max_students: number;
}

interface UserData {
    id: string;
    full_name?: string;
    avatar_url?: string;
    suspended?: boolean;
    suspended_reason?: string;
}

interface TeacherAvailabilityClientProps {
    user: UserData;
    teacherProfileId: string;
    initialDateSlots: DateAvailabilitySlot[];
    initialAutoAccept: boolean;
    subjects: string[];
    initialBufferMinutes: number;
    initialIsBufferEnabled: boolean;
}

export default function TeacherAvailabilityClient({
    user,
    teacherProfileId,
    initialDateSlots,
    initialAutoAccept,
    subjects,
    initialBufferMinutes,
    initialIsBufferEnabled
}: TeacherAvailabilityClientProps) {
    const router = useRouter();
    const [dateSlots, setDateSlots] = useState<DateAvailabilitySlot[]>(initialDateSlots);
    const [autoAccept, setAutoAccept] = useState(initialAutoAccept);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    // New slot form for selected date
    const [showAddForm, setShowAddForm] = useState(false);
    const [newSlot, setNewSlot] = useState({
        startTime: "09:00",
        duration: 60,
        lessonType: "one_on_one" as "one_on_one" | "group",
        maxStudents: 5
    });

    const supabase = createClient();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const formatDate = (date: Date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    const selectedDateKey = formatDate(selectedDate);

    const filteredSlots = dateSlots.filter(s => s.available_date === selectedDateKey)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

    const calculateEndTime = (startTime: string, durationMinutes: number): string => {
        const [hours, minutes] = startTime.split(":").map(Number);
        const totalMinutes = hours * 60 + minutes + durationMinutes;
        const endHours = Math.floor(totalMinutes / 60) % 24;
        const endMinutes = totalMinutes % 60;
        return `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;
    };

    const handleAddSlot = async () => {
        if (!user || user.suspended) return;
        setSaving(true);
        setError(null);

        const endTime = calculateEndTime(newSlot.startTime, newSlot.duration);

        try {
            const response = await fetch("/api/availability/date", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    teacher_id: teacherProfileId,
                    available_date: selectedDateKey,
                    start_time: newSlot.startTime,
                    end_time: endTime,
                    lesson_type: newSlot.lessonType,
                    max_students: newSlot.lessonType === "group" ? newSlot.maxStudents : 1
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to add slot");
            }

            setDateSlots([...dateSlots, data.data]);
            setShowAddForm(false);
            toast.success("Availability slot added!");
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSlot = async (id: string) => {
        if (!user || user.suspended) return;
        try {
            const response = await fetch(`/api/availability/date?id=${id}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Failed to delete slot");
            setDateSlots(dateSlots.filter(s => s.id !== id));
            toast.success("Slot deleted");
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleSaveAutoAccept = async (checked: boolean) => {
        if (!user || user.suspended) return;
        setAutoAccept(checked);
        try {
            const { error } = await supabase
                .from("teacher_profiles")
                .update({ auto_accept_bookings: checked })
                .eq("id", teacherProfileId);
            if (error) throw error;
            toast.success("Setting updated");
        } catch (err: any) {
            toast.error(err.message);
            setAutoAccept(!checked);
        }
    };

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const hasSlotsOnDay = (day: number) => {
        const dkey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return dateSlots.some(s => s.available_date === dkey);
    };

    if (user.suspended) {
        return (
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/20">
                <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                    <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">Account Suspended</h2>
                    <p className="text-red-600 dark:text-red-300 max-w-md">
                        Your account is currently suspended. {user.suspended_reason && `Reason: ${user.suspended_reason}`}
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Availability</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage your teaching schedule and preferences.</p>
                </div>
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="text-right">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">Auto-accept</p>
                        <p className="text-[10px] text-slate-500">Instant booking</p>
                    </div>
                    <Switch checked={autoAccept} onCheckedChange={handleSaveAutoAccept} />
                </div>
            </div>

            <Tabs defaultValue="schedule" className="space-y-6">
                <TabsList className="bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-1 h-12 gap-1 rounded-xl shadow-sm">
                    <TabsTrigger value="schedule" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 transition-all font-semibold">
                        <CalendarIcon className="h-4 w-4 mr-2" /> Schedule
                    </TabsTrigger>
                    <TabsTrigger value="patterns" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 transition-all font-semibold">
                        <Repeat className="h-4 w-4 mr-2" /> Weekly Patterns
                    </TabsTrigger>
                    <TabsTrigger value="rules" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400 transition-all font-semibold">
                        <Settings className="h-4 w-4 mr-2" /> Buffer & Rules
                    </TabsTrigger>
                    <TabsTrigger value="time-off" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-rose-600 dark:data-[state=active]:text-rose-400 transition-all font-semibold">
                        <CalendarCheck className="h-4 w-4 mr-2" /> Time Off
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="schedule" className="mt-0 focus-visible:ring-0">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Calendar View */}
                        <Card className="lg:col-span-7 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <CalendarIcon className="h-5 w-5 text-indigo-500" />
                                    {monthNames[month]} {year}
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {dayNames.map(d => (
                                        <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-2">{d}</div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {days.map((day, i) => {
                                        if (day === null) return <div key={`empty-${i}`} className="aspect-square" />;

                                        const date = new Date(year, month, day);
                                        const isSelected = selectedDate.toDateString() === date.toDateString();
                                        const hasSlots = hasSlotsOnDay(day);
                                        const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

                                        return (
                                            <button
                                                key={day}
                                                onClick={() => setSelectedDate(date)}
                                                className={cn(
                                                    "aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all border",
                                                    isSelected
                                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105 z-10"
                                                        : isPast
                                                            ? "text-slate-300 dark:text-slate-700 border-transparent cursor-default opacity-50"
                                                            : "text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                                                )}
                                                disabled={isPast}
                                            >
                                                <span className="font-semibold">{day}</span>
                                                {hasSlots && (
                                                    <span className={cn(
                                                        "w-1 h-1 rounded-full mt-1",
                                                        isSelected ? "bg-white" : "bg-indigo-500"
                                                    )} />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Day Details */}
                        <Card className="lg:col-span-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                                            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                        </CardTitle>
                                        <p className="text-xs text-slate-500 mt-0.5">{filteredSlots.length} slots scheduled</p>
                                    </div>
                                    <Button size="sm" onClick={() => setShowAddForm(true)} className="bg-indigo-600 text-white hover:bg-indigo-700 h-8">
                                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Slot
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {showAddForm && (
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold uppercase text-slate-500">Start Time</label>
                                                <select
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm"
                                                    value={newSlot.startTime}
                                                    onChange={e => setNewSlot({ ...newSlot, startTime: e.target.value })}
                                                >
                                                    {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold uppercase text-slate-500">Duration</label>
                                                <select
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm"
                                                    value={newSlot.duration}
                                                    onChange={e => setNewSlot({ ...newSlot, duration: parseInt(e.target.value) })}
                                                >
                                                    {durations.map(d => <option key={d} value={d}>{d} min</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase text-slate-500">Type</label>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setNewSlot({ ...newSlot, lessonType: 'one_on_one' })}
                                                    className={cn("flex-1 px-3 py-2 rounded-lg border text-xs font-semibold transition-all",
                                                        newSlot.lessonType === 'one_on_one' ? "bg-indigo-600 text-white border-indigo-600" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700")}
                                                >
                                                    1-on-1
                                                </button>
                                                <button
                                                    onClick={() => setNewSlot({ ...newSlot, lessonType: 'group' })}
                                                    className={cn("flex-1 px-3 py-2 rounded-lg border text-xs font-semibold transition-all",
                                                        newSlot.lessonType === 'group' ? "bg-indigo-600 text-white border-indigo-600" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700")}
                                                >
                                                    Group
                                                </button>
                                            </div>
                                        </div>
                                        {newSlot.lessonType === 'group' && (
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold uppercase text-slate-500">Capacity</label>
                                                <input
                                                    type="number"
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm"
                                                    value={newSlot.maxStudents}
                                                    onChange={e => setNewSlot({ ...newSlot, maxStudents: parseInt(e.target.value) })}
                                                />
                                            </div>
                                        )}
                                        <div className="flex gap-2 pt-2">
                                            <Button variant="ghost" className="flex-1 h-9" onClick={() => setShowAddForm(false)}>Cancel</Button>
                                            <Button onClick={handleAddSlot} disabled={saving} className="flex-1 h-9 bg-indigo-600 text-white hover:bg-indigo-700">
                                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Slot"}
                                            </Button>
                                        </div>
                                        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
                                    </div>
                                )}

                                <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {filteredSlots.length === 0 ? (
                                        <div className="p-12 text-center">
                                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                                                <Clock className="h-6 w-6 text-slate-400" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">No slots available</p>
                                            <p className="text-xs text-slate-500 mt-1">Students won't be able to book on this day.</p>
                                        </div>
                                    ) : (
                                        filteredSlots.map(slot => (
                                            <div key={slot.id} className="p-4 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                                                        <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                            {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            {slot.lesson_type === 'group' ? (
                                                                <span className="flex items-center text-[10px] font-bold text-indigo-600 uppercase">
                                                                    <Users className="h-2.5 w-2.5 mr-1" /> Group ({slot.max_students})
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase">1-on-1</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteSlot(slot.id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-500"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="patterns" className="mt-0 focus-visible:ring-0">
                    <RecurringPatterns />
                </TabsContent>

                <TabsContent value="rules" className="mt-0 focus-visible:ring-0">
                    <BufferSettings
                        initialBufferMinutes={initialBufferMinutes}
                        initialIsBufferEnabled={initialIsBufferEnabled}
                    />
                </TabsContent>

                <TabsContent value="time-off" className="mt-0 focus-visible:ring-0">
                    <TimeOff />
                </TabsContent>
            </Tabs>
        </div>
    );
}


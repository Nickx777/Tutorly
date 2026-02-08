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
                    {/* Buffer Settings Removed as per request */}
                    {/* <TabsTrigger value="rules" ... /> */}
                    {/* <TabsContent value="rules" ... />  */}
                </TabsList>

                <TabsContent value="time-off" className="mt-0 focus-visible:ring-0">
                    <TimeOff />
                </TabsContent>
            </Tabs>
        </div>
    );
}


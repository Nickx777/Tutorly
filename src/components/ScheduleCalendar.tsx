"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lesson {
    id: string;
    subject: string;
    teacher: string;
    time: string;
}

interface DayLessons {
    [key: string]: Lesson[];
}

interface ScheduleCalendarProps {
    className?: string;
    lessons?: DayLessons;
}

// Schedule calendar component

export function ScheduleCalendar({ className, lessons = {} }: ScheduleCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [hoveredDate, setHoveredDate] = useState<number | null>(null);

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const isSelected = (day: number) => {
        return selectedDate.getDate() === day &&
            selectedDate.getMonth() === month &&
            selectedDate.getFullYear() === year;
    };

    const isToday = (day: number) => {
        const today = new Date();
        return today.getDate() === day &&
            today.getMonth() === month &&
            today.getFullYear() === year;
    };

    const getDateKey = (day: number) => {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const getLessonsForDay = (day: number): Lesson[] => {
        return lessons[getDateKey(day)] || [];
    };

    const hasLessons = (day: number) => {
        return getLessonsForDay(day).length > 0;
    };

    const days = [];
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    return (
        <div className={cn("w-full", className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {monthNames[month]} {year}
                </h2>
                <div className="flex items-center gap-4">
                    <button
                        onClick={prevMonth}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        onClick={nextMonth}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-2 mb-4">
                {dayNames.map((day, index) => (
                    <div
                        key={index}
                        className="text-center text-xs font-medium text-slate-400 dark:text-slate-500"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-y-2">
                {days.map((day, index) => {
                    const dayLessons = day ? getLessonsForDay(day) : [];
                    const isHovered = hoveredDate === day;

                    return (
                        <div key={index} className="aspect-square flex items-center justify-center relative">
                            {day && (
                                <>
                                    <button
                                        onClick={() => setSelectedDate(new Date(year, month, day))}
                                        onMouseEnter={() => setHoveredDate(day)}
                                        onMouseLeave={() => setHoveredDate(null)}
                                        className={cn(
                                            "w-10 h-10 flex flex-col items-center justify-center rounded-full text-sm font-medium transition-all relative",
                                            isSelected(day)
                                                ? "bg-violet-600 text-white"
                                                : isToday(day)
                                                    ? "bg-violet-600/20 text-violet-600 dark:text-violet-400"
                                                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        )}
                                    >
                                        {day}
                                        {hasLessons(day) && !isSelected(day) && (
                                            <span className="w-1 h-1 mt-0.5 rounded-full bg-violet-500" />
                                        )}
                                    </button>

                                    {/* Hover Tooltip */}
                                    {isHovered && dayLessons.length > 0 && (
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 w-48 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700">
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                                                {monthNames[month]} {day}, {year}
                                            </p>
                                            <div className="space-y-2">
                                                {dayLessons.map((lesson) => (
                                                    <div key={lesson.id} className="border-l-2 border-violet-500 pl-2">
                                                        <p className="text-sm font-medium text-slate-800 dark:text-white">
                                                            {lesson.subject}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            {lesson.time} • {lesson.teacher}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Arrow */}
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white dark:bg-slate-800 border-r border-b border-slate-200 dark:border-slate-700 rotate-45" />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

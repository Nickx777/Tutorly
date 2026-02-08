
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
    add,
    eachDayOfInterval,
    endOfMonth,
    format,
    getDay,
    isEqual,
    isSameDay,
    isSameMonth,
    isToday,
    parse,
    startOfToday,
} from "date-fns";
import { cn } from "@/lib/utils";

interface Event {
    date: Date;
    title: string;
    type?: "lesson" | "other";
}

interface CustomCalendarProps {
    className?: string;
    events?: Event[];
    onDateSelect?: (date: Date) => void;
    selectedDate?: Date;
}

export function CustomCalendar({ className, events = [], onDateSelect, selectedDate: propSelectedDate }: CustomCalendarProps) {
    let today = startOfToday();
    let [selectedDay, setSelectedDay] = React.useState(propSelectedDate || today);
    let [currentMonth, setCurrentMonth] = React.useState(format(today, "MMM-yyyy"));
    let firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date());

    let days = eachDayOfInterval({
        start: firstDayCurrentMonth,
        end: endOfMonth(firstDayCurrentMonth),
    });

    function previousMonth() {
        let firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 });
        setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
    }

    function nextMonth() {
        let firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 });
        setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
    }

    const handleDateClick = (day: Date) => {
        setSelectedDay(day);
        onDateSelect?.(day);
    };

    return (
        <div className={cn("p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col h-full", className)}>
            <div className="flex items-center justify-between mb-8">
                <h2 className="font-semibold text-xl text-slate-900 dark:text-white">
                    {format(firstDayCurrentMonth, "MMMM yyyy")}
                </h2>
                <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={previousMonth}
                        className="-my-1.5 flex flex-none items-center justify-center p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
                    >
                        <span className="sr-only">Previous month</span>
                        <ChevronLeft className="w-6 h-6" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        onClick={nextMonth}
                        className="-my-1.5 -mr-1.5 flex flex-none items-center justify-center p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
                    >
                        <span className="sr-only">Next month</span>
                        <ChevronRight className="w-6 h-6" aria-hidden="true" />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-7 mb-4 text-xs font-medium leading-6 text-center text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
            </div>
            <div className="grid grid-cols-7 text-sm flex-1 content-between gap-y-2">
                {days.map((day, dayIdx) => {
                    const hasEvent = events.some(event => isSameDay(event.date, day));
                    return (
                        <div
                            key={day.toString()}
                            className={cn(
                                dayIdx === 0 && colStartClasses[getDay(day)],
                                "py-2 flex items-center justify-center relative group"
                            )}
                        >
                            <button
                                type="button"
                                onClick={() => handleDateClick(day)}
                                className={cn(
                                    isEqual(day, selectedDay) && "text-white",
                                    !isEqual(day, selectedDay) &&
                                    isToday(day) &&
                                    "text-violet-600 dark:text-violet-400 font-semibold",
                                    !isEqual(day, selectedDay) &&
                                    !isToday(day) &&
                                    isSameMonth(day, firstDayCurrentMonth) &&
                                    "text-slate-700 dark:text-slate-200",
                                    !isEqual(day, selectedDay) &&
                                    !isToday(day) &&
                                    !isSameMonth(day, firstDayCurrentMonth) &&
                                    "text-slate-400 dark:text-slate-600",
                                    isEqual(day, selectedDay) && isToday(day) && "bg-violet-600",
                                    isEqual(day, selectedDay) &&
                                    !isToday(day) &&
                                    "bg-slate-200 dark:bg-slate-700",
                                    !isEqual(day, selectedDay) && "hover:bg-slate-100 dark:hover:bg-white/10",
                                    (isEqual(day, selectedDay) || isToday(day)) &&
                                    "font-semibold",
                                    "mx-auto flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200 text-base"
                                )}
                            >
                                <time dateTime={format(day, "yyyy-MM-dd")}>
                                    {format(day, "d")}
                                </time>
                                {hasEvent && (
                                    <span className="absolute bottom-2 h-1.5 w-1.5 bg-violet-500 dark:bg-violet-400 rounded-full shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
                                )}
                            </button>

                            {/* Hover Tooltip */}
                            {hasEvent && (
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max min-w-[120px] p-3 bg-white dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none z-50 shadow-xl">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{format(day, "MMM d")}</div>
                                        {events.filter(e => isSameDay(e.date, day)).map((e, i) => (
                                            <div key={i} className="text-sm font-medium text-slate-900 dark:text-white whitespace-nowrap">
                                                {e.title}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white dark:bg-slate-900/90 border-r border-b border-slate-200 dark:border-white/10 rotate-45" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

let colStartClasses = [
    "",
    "col-start-2",
    "col-start-3",
    "col-start-4",
    "col-start-5",
    "col-start-6",
    "col-start-7",
];

import * as React from "react";
import { Plus, Edit2, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, isSameDay, isToday, getDate, getDaysInMonth, startOfMonth } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// --- TYPE DEFINITIONS ---
interface Lesson {
    id: string;
    subject: string;
    teacher: string;
    time: string;
}

interface DayLessons {
    [key: string]: Lesson[];
}

interface Day {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
}

interface GlassCalendarProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  className?: string;
  lessons?: DayLessons;
}

// Sample lessons data
const defaultLessons: DayLessons = {
    "2026-02-03": [
        { id: "1", subject: "Mathematics", teacher: "Dr. Alex Turner", time: "10:00 AM" },
    ],
    "2026-02-06": [
        { id: "2", subject: "Physics", teacher: "Prof. Sarah Lee", time: "2:00 PM" },
    ],
    "2026-02-10": [
        { id: "3", subject: "Chemistry", teacher: "Dr. Emily Watson", time: "9:00 AM" },
    ],
    "2026-02-15": [
        { id: "4", subject: "Spanish", teacher: "Maria Garcia", time: "11:00 AM" },
        { id: "5", subject: "English", teacher: "James Brown", time: "3:00 PM" },
    ],
    "2026-02-20": [
        { id: "6", subject: "Computer Science", teacher: "Prof. James Miller", time: "1:00 PM" },
    ],
};

// --- MAIN COMPONENT ---
export const GlassCalendar = React.forwardRef<HTMLDivElement, GlassCalendarProps>(
  ({ className, selectedDate: propSelectedDate, onDateSelect, lessons = defaultLessons, ...props }, ref) => {
    const [currentMonth, setCurrentMonth] = React.useState(propSelectedDate || new Date());
    const [selectedDate, setSelectedDate] = React.useState(propSelectedDate || new Date());
    const [hoveredDate, setHoveredDate] = React.useState<Date | null>(null);

    // Generate all days for the current month
    const monthDays = React.useMemo(() => {
        const start = startOfMonth(currentMonth);
        const totalDays = getDaysInMonth(currentMonth);
        const days: Day[] = [];
        for (let i = 0; i < totalDays; i++) {
            const date = new Date(start.getFullYear(), start.getMonth(), i + 1);
            days.push({
                date,
                isToday: isToday(date),
                isSelected: isSameDay(date, selectedDate),
            });
        }
        return days;
    }, [currentMonth, selectedDate]);

    const handleDateClick = (date: Date) => {
      setSelectedDate(date);
      onDateSelect?.(date);
    };
    
    const handlePrevMonth = () => {
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    const getDateKey = (date: Date) => {
        return format(date, "yyyy-MM-dd");
    };

    const getLessonsForDay = (date: Date): Lesson[] => {
        return lessons[getDateKey(date)] || [];
    };

    const hasLessons = (date: Date) => {
        return getLessonsForDay(date).length > 0;
    };

    return (
      <div
        ref={ref}
        className={cn(
          "w-full max-w-[360px] rounded-3xl p-5 shadow-2xl overflow-hidden",
          "bg-black/20 backdrop-blur-xl border border-white/10",
          "text-white font-sans",
          className
        )}
        {...props}
      >
        {/* Date Display and Navigation */}
        <div className="mb-6 flex items-center justify-between">
            <motion.p 
              key={format(currentMonth, "MMMM")}
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.3 }}
              className="text-4xl font-bold tracking-tight"
            >
                {format(currentMonth, "MMMM")}
            </motion.p>
            <div className="flex items-center space-x-2">
                <button onClick={handlePrevMonth} className="p-1 rounded-full text-white/70 transition-colors hover:bg-black/20">
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <button onClick={handleNextMonth} className="p-1 rounded-full text-white/70 transition-colors hover:bg-black/20">
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>
        </div>

        {/* Scrollable Monthly Calendar Grid */}
        <div className="overflow-x-auto scrollbar-hide -mx-5 px-5">
            <div className="flex space-x-4">
                {monthDays.map((day) => {
                    const dayLessons = getLessonsForDay(day.date);
                    const isHovered = hoveredDate && isSameDay(day.date, hoveredDate);
                    
                    return (
                        <div 
                            key={format(day.date, "yyyy-MM-dd")} 
                            className="flex flex-col items-center space-y-2 flex-shrink-0 relative"
                            onMouseEnter={() => setHoveredDate(day.date)}
                            onMouseLeave={() => setHoveredDate(null)}
                        >
                            <span className="text-xs font-bold text-white/50">
                                {format(day.date, "E").charAt(0)}
                            </span>
                            <button
                                onClick={() => handleDateClick(day.date)}
                                className={cn(
                                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200 relative",
                                    {
                                        "bg-gradient-to-br from-violet-500 to-pink-500 text-white shadow-lg": day.isSelected,
                                        "bg-white/10": !day.isSelected && hasLessons(day.date),
                                        "hover:bg-white/20": !day.isSelected,
                                        "text-white": !day.isSelected,
                                    }
                                )}
                            >
                                {getDate(day.date)}
                                {hasLessons(day.date) && !day.isSelected && (
                                    <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-violet-400" />
                                )}
                            </button>
                            
                            {/* Hover Tooltip */}
                            {isHovered && dayLessons.length > 0 && (
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 w-48 p-3 bg-slate-800 rounded-xl shadow-xl border border-slate-700">
                                    <p className="text-xs font-semibold text-slate-400 mb-2">
                                        {format(day.date, "MMMM d, yyyy")}
                                    </p>
                                    <div className="space-y-2">
                                        {dayLessons.map((lesson) => (
                                            <div key={lesson.id} className="border-l-2 border-violet-500 pl-2">
                                                <p className="text-sm font-medium text-white">
                                                    {lesson.subject}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {lesson.time} • {lesson.teacher}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Arrow */}
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-r border-b border-slate-700 rotate-45" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
        
        {/* Divider */}
        <div className="mt-6 h-px bg-white/20" />

        {/* Footer Actions */}
        <div className="mt-4 flex items-center justify-between space-x-4">
           <button className="flex items-center space-x-2 text-sm font-medium text-white/70 transition-colors hover:text-white">
             <Edit2 className="h-4 w-4" />
             <span>Add a note...</span>
           </button>
           <button className="flex items-center space-x-2 rounded-lg bg-black/20 px-3 py-2 text-xs font-bold text-white shadow-md transition-colors hover:bg-black/30">
             <Plus className="h-4 w-4" />
             <span>New Event</span>
           </button>
        </div>
      </div>
    );
  }
);

GlassCalendar.displayName = "GlassCalendar";

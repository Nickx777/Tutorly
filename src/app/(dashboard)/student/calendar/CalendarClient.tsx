"use client";

import { motion } from "framer-motion";
import { Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { CustomCalendar } from "@/components/custom-calendar";
import { PageTransition } from "@/components/ui/PageTransition";

interface CalendarClientProps {
    events: { date: Date; title: string }[];
}

export default function CalendarClient({ events }: CalendarClientProps) {
    return (
        <PageTransition className="h-[calc(100vh-80px)] -m-6 flex flex-col overflow-auto">
            <div className="p-6 space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Calendar</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">View your scheduled lessons and events.</p>
                </div>

                {/* Calendar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1"
                >
                    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5 text-violet-500" />
                                Your Schedule
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CustomCalendar
                                events={events}
                                className="min-h-[500px]"
                            />
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </PageTransition>
    );
}


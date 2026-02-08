"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Star, Users, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import DisplayCards from "@/components/ui/display-cards";
import { Sparkles } from "lucide-react";

const stats = [
    { icon: Users, value: "10,000+", label: "Active Students" },
    { icon: BookOpen, value: "5,000+", label: "Lessons Completed" },
    { icon: Star, value: "4.9", label: "Average Rating" },
];

const heroCards = [
    {
        icon: <Sparkles className="size-4 text-zinc-300" />,
        title: "Find Tutors",
        description: "Expert help in any subject",
        date: "Available 24/7",
        className: "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
        icon: <Sparkles className="size-4 text-zinc-300" />,
        title: "Video Lessons",
        description: "HD 1-on-1 sessions",
        date: "Start learning",
        className: "[grid-area:stack] translate-x-12 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
        icon: <Sparkles className="size-4 text-zinc-300" />,
        title: "Master Skills",
        description: "Achieve your goals",
        date: "Join today",
        className: "[grid-area:stack] translate-x-24 translate-y-20 hover:translate-y-10",
    },
];

export function Hero() {
    return (
        <section className="relative pt-32 pb-20 overflow-hidden bg-slate-50 dark:bg-slate-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="max-w-2xl">
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-200 dark:bg-zinc-800/50 text-slate-700 dark:text-zinc-300 text-sm font-medium mb-8 border border-slate-300 dark:border-zinc-800"
                        >
                            <span className="w-2 h-2 rounded-full bg-violet-500 dark:bg-zinc-400 animate-pulse" />
                            The #1 Online Tutoring Platform
                        </motion.div>

                        {/* Headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-slate-900 dark:text-white"
                        >
                            Learn Anything,{" "}
                            <span className="text-slate-500 dark:text-zinc-400">Anywhere.</span>
                        </motion.h1>

                        {/* Subheadline */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="text-xl text-slate-600 dark:text-zinc-400 mb-10 leading-relaxed"
                        >
                            Connect with world-class tutors for personalized 1-on-1 lessons.
                            Master new skills, ace your exams, or explore your passions.
                        </motion.p>

                        {/* CTAs */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center gap-4 mb-16"
                        >
                            <GradientButton asChild className="min-w-[180px]">
                                <Link href="/register">
                                    Get Started
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </GradientButton>
                        </motion.div>

                        {/* Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="grid grid-cols-3 gap-8"
                        >
                            {stats.map((stat) => (
                                <div key={stat.label}>
                                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                                    <div className="text-sm text-slate-500 dark:text-zinc-500">{stat.label}</div>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Hero Visual */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7, delay: 0.5 }}
                        className="flex items-center justify-center min-h-[400px]"
                    >
                        <DisplayCards cards={heroCards} />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

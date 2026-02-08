"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
    children: ReactNode;
    className?: string;
}

const pageVariants = {
    initial: {
        opacity: 0,
        y: 20,
    },
    animate: {
        opacity: 1,
        y: 0,
    },
    exit: {
        opacity: 0,
        y: -10,
    },
};

const pageTransition = {
    type: "tween" as const,
    ease: "easeOut" as const,
    duration: 0.25,
};

export function PageTransition({ children, className = "" }: PageTransitionProps) {
    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Skeleton components for loading states
export function SkeletonCard({ className = "" }: { className?: string }) {
    return (
        <div className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800 ${className}`} />
    );
}

export function SkeletonText({ className = "", width = "w-full" }: { className?: string; width?: string }) {
    return (
        <div className={`animate-pulse rounded bg-slate-200 dark:bg-slate-800 h-4 ${width} ${className}`} />
    );
}

export function PageSkeleton() {
    return (
        <div className="space-y-6 animate-in fade-in duration-150">
            {/* Header skeleton */}
            <div className="space-y-2">
                <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                <div className="h-4 w-72 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            </div>

            {/* Cards grid skeleton */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                        <div className="flex justify-between">
                            <div className="h-6 w-32 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                            <div className="h-6 w-16 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                            <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                        </div>
                        <div className="h-10 w-full rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    </div>
                ))}
            </div>

            {/* Large content area skeleton */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <div className="h-6 w-40 rounded bg-slate-200 dark:bg-slate-800 animate-pulse mb-4" />
                <div className="h-64 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            </div>
        </div>
    );
}

export function MessagesSkeleton() {
    return (
        <div className="h-[calc(100vh-80px)] -m-6 flex animate-in fade-in duration-150">
            {/* Sidebar skeleton */}
            <div className="w-80 border-r border-slate-200 dark:border-slate-800 p-4 space-y-4">
                <div className="h-10 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                        <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                            <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
            {/* Chat area skeleton */}
            <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="h-6 w-40 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                </div>
                <div className="flex-1 p-4">
                    <div className="flex flex-col gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                                <div className={`h-12 ${i % 2 === 0 ? 'w-48' : 'w-64'} rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse`} />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="h-12 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
                </div>
            </div>
        </div>
    );
}

export function CalendarSkeleton() {
    return (
        <div className="h-[calc(100vh-80px)] -m-6 flex flex-col overflow-auto animate-in fade-in duration-150">
            <div className="p-6 space-y-6">
                <div className="space-y-2">
                    <div className="h-7 w-32 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    <div className="h-4 w-56 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-5 w-5 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                        <div className="h-6 w-32 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    </div>
                    <div className="h-[500px] rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                </div>
            </div>
        </div>
    );
}

export function SettingsSkeleton() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-150">
            <div className="space-y-2">
                <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                <div className="h-4 w-64 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-32 w-32 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                        <div className="h-9 w-32 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    </div>
                    <div className="flex-1 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            {[1, 2].map((i) => (
                                <div key={i} className="space-y-2">
                                    <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                                    <div className="h-10 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
                                </div>
                            ))}
                        </div>
                        <div className="h-10 w-32 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function PaymentsSkeleton() {
    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-150">
            <div className="space-y-2">
                <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                <div className="h-4 w-64 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            </div>
            <div className="grid md:grid-cols-3 gap-8">
                <div className="h-32 rounded-xl bg-gradient-to-br from-violet-600/50 to-indigo-700/50 animate-pulse" />
                <div className="md:col-span-2 h-32 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                <div className="h-6 w-40 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between items-center py-4 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                            <div className="space-y-2">
                                <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                                <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                            </div>
                        </div>
                        <div className="text-right space-y-2">
                            <div className="h-5 w-16 rounded bg-slate-200 dark:bg-slate-800 animate-pulse ml-auto" />
                            <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

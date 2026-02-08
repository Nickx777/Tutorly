"use client";

import { motion } from "framer-motion";
import { Search, CalendarCheck, Video, MessageCircle } from "lucide-react";

const steps = [
    {
        step: 1,
        icon: Search,
        title: "Find Your Tutor",
        description: "Browse our network of verified tutors. Filter by subject, price, rating, and availability.",
    },
    {
        step: 2,
        icon: CalendarCheck,
        title: "Book a Lesson",
        description: "Pick a time that works for you. Our smart scheduler handles timezone conversion automatically.",
    },
    {
        step: 3,
        icon: Video,
        title: "Learn Online",
        description: "Join your video lesson with one click. Screen share, whiteboard, and chat included.",
    },
    {
        step: 4,
        icon: MessageCircle,
        title: "Review & Repeat",
        description: "Rate your experience, book follow-ups, and track your learning progress over time.",
    },
];

export function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-zinc-600/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-slate-600/10 rounded-full blur-[150px]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <span className="text-sm font-semibold text-slate-500 dark:text-zinc-500 tracking-wider uppercase">
                        How It Works
                    </span>
                    <h2 className="mt-3 text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white">
                        Start Learning in{" "}
                        <span className="text-slate-600 dark:text-zinc-400">
                            4 Simple Steps
                        </span>
                    </h2>
                    <p className="mt-4 text-lg text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto">
                        Getting started is easy. Book your first lesson in under 5 minutes.
                    </p>
                </motion.div>

                {/* Steps */}
                <div className="grid md:grid-cols-4 gap-8 relative">
                    {/* Connecting line */}
                    <div className="hidden md:block absolute top-[60px] left-[12.5%] right-[12.5%] h-px bg-slate-200 dark:bg-zinc-800" />

                    {steps.map((step, index) => (
                        <motion.div
                            key={step.step}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.15 }}
                            className="relative text-center"
                        >
                            {/* Step number circle */}
                            <div className="relative z-10 mx-auto mb-6">
                                <div className="w-[120px] h-[120px] rounded-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-zinc-900 flex items-center justify-center mx-auto group hover:border-slate-300 dark:hover:border-zinc-700 transition-colors duration-300">
                                    <div className="w-[100px] h-[100px] rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center border border-slate-200 dark:border-zinc-800">
                                        <step.icon className="h-10 w-10 text-slate-900 dark:text-white" />
                                    </div>
                                </div>
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-zinc-700 flex items-center justify-center text-sm font-bold text-slate-900 dark:text-white">
                                    {step.step}
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                            <p className="text-slate-600 dark:text-zinc-400 text-sm leading-relaxed">
                                {step.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

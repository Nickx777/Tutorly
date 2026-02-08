"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { GradientButton } from "@/components/ui/gradient-button";

export function CTA() {
    return (
        <section className="py-24 relative overflow-hidden bg-slate-50 dark:bg-slate-950">
            {/* Background */}
            <div className="absolute inset-0 bg-transparent" />

            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-[0.03]">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                >
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6">
                        Ready to Start Your
                        <br />
                        <span className="text-slate-500 dark:text-zinc-500">Learning Journey?</span>
                    </h2>
                    <p className="text-xl text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10">
                        Join thousands of students and tutors already using Tutorly.
                        Your first lesson awaits.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <GradientButton asChild className="min-w-[180px]">
                            <Link href="/browse">
                                Find a Tutor
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </GradientButton>
                        <GradientButton asChild variant="variant" className="min-w-[180px]">
                            <Link href="/register?role=teacher">
                                Become a Tutor
                            </Link>
                        </GradientButton>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

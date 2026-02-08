"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar,
    Search,
    MessageSquare,
    Bell,
    Settings,
    BookOpen,
    Users,
    CreditCard,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    Sparkles,
    Target,
    Clock,
    Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface TutorialStep {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    tips: string[];
}

const STUDENT_STEPS: TutorialStep[] = [
    {
        id: "browse",
        title: "Find Your Tutor",
        description: "Browse our network of expert tutors filtered by subject, availability, and reviews.",
        icon: <Search className="h-8 w-8" />,
        tips: [
            "Use filters to narrow down by subject",
            "Check tutor ratings and reviews",
            "View their availability before booking"
        ]
    },
    {
        id: "book",
        title: "Book a Lesson",
        description: "Schedule lessons at times that work for you with just a few clicks.",
        icon: <Calendar className="h-8 w-8" />,
        tips: [
            "Select your preferred date and time",
            "Choose between 1-on-1 or group lessons",
            "Add any notes for your tutor"
        ]
    },
    {
        id: "messages",
        title: "Chat with Tutors",
        description: "Send messages to tutors before or after lessons to discuss your learning goals.",
        icon: <MessageSquare className="h-8 w-8" />,
        tips: [
            "Ask questions about teaching style",
            "Share your learning objectives",
            "Coordinate lesson materials"
        ]
    },
    {
        id: "dashboard",
        title: "Track Your Progress",
        description: "Your dashboard shows upcoming lessons, completed sessions, and your learning journey.",
        icon: <Target className="h-8 w-8" />,
        tips: [
            "View your upcoming lessons at a glance",
            "See your learning stats",
            "Access lesson history and materials"
        ]
    }
];

const TEACHER_STEPS: TutorialStep[] = [
    {
        id: "availability",
        title: "Set Your Availability",
        description: "Tell students when you're free to teach by setting your weekly schedule.",
        icon: <Clock className="h-8 w-8" />,
        tips: [
            "Set recurring weekly slots",
            "Enable group lessons for more earnings",
            "Block dates when you're unavailable"
        ]
    },
    {
        id: "profile",
        title: "Complete Your Profile",
        description: "A detailed profile helps students find you and understand your teaching style.",
        icon: <Users className="h-8 w-8" />,
        tips: [
            "Add a professional photo",
            "Write an engaging bio",
            "List all subjects you can teach"
        ]
    },
    {
        id: "bookings",
        title: "Manage Bookings",
        description: "Accept or decline lesson requests and keep track of your teaching schedule.",
        icon: <Calendar className="h-8 w-8" />,
        tips: [
            "Review booking requests promptly",
            "Turn on auto-accept for faster bookings",
            "Sync with Google Calendar"
        ]
    },
    {
        id: "earnings",
        title: "Track Your Earnings",
        description: "Monitor your income, view payment history, and manage your payouts.",
        icon: <CreditCard className="h-8 w-8" />,
        tips: [
            "View detailed earnings breakdown",
            "Set up your payout method",
            "Create packages for recurring students"
        ]
    },
    {
        id: "messages",
        title: "Connect with Students",
        description: "Build relationships with students through messaging before and after lessons.",
        icon: <MessageSquare className="h-8 w-8" />,
        tips: [
            "Respond to inquiries quickly",
            "Share lesson materials",
            "Maintain professional communication"
        ]
    }
];

interface InteractiveTutorialProps {
    role: "student" | "teacher";
    onComplete: () => void;
}

export default function InteractiveTutorial({ role, onComplete }: InteractiveTutorialProps) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

    const steps = role === "teacher" ? TEACHER_STEPS : STUDENT_STEPS;
    const step = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;

    const handleNext = () => {
        setCompletedSteps(prev => new Set([...prev, step.id]));
        if (isLastStep) {
            onComplete();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSkip = () => {
        onComplete();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-slate-100 dark:from-slate-950 dark:via-violet-950/20 dark:to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Progress Indicator */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Step {currentStep + 1} of {steps.length}
                        </span>
                        <button
                            onClick={handleSkip}
                            className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        >
                            Skip Tutorial
                        </button>
                    </div>
                    <div className="flex gap-2">
                        {steps.map((s, i) => (
                            <div
                                key={s.id}
                                className={`h-2 flex-1 rounded-full transition-all duration-300 ${i < currentStep
                                    ? "bg-green-500"
                                    : i === currentStep
                                        ? "bg-violet-600"
                                        : "bg-slate-200 dark:bg-slate-700"
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Main Card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                    >
                        {/* Header with Icon */}
                        <div className="bg-gradient-to-br from-violet-600 to-purple-600 p-8 text-white">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                                    {step.icon}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">{step.title}</h2>
                                    <p className="text-violet-100 mt-1">{step.description}</p>
                                </div>
                            </div>
                        </div>

                        {/* Tips Section */}
                        <div className="p-8">
                            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-violet-500" />
                                Pro Tips
                            </h3>
                            <ul className="space-y-3">
                                {step.tips.map((tip, i) => (
                                    <motion.li
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-start gap-3"
                                    >
                                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-slate-700 dark:text-slate-300">{tip}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>

                        {/* Navigation */}
                        <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-between">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                disabled={currentStep === 0}
                                className="border-slate-300 dark:border-slate-600"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                            <Button
                                onClick={handleNext}
                                className="bg-violet-600 hover:bg-violet-700 text-white"
                            >
                                {isLastStep ? (
                                    <>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Finish Tutorial
                                    </>
                                ) : (
                                    <>
                                        Next
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Step Dots Navigation */}
                <div className="flex justify-center gap-2 mt-6">
                    {steps.map((s, i) => (
                        <button
                            key={s.id}
                            onClick={() => setCurrentStep(i)}
                            className={`w-3 h-3 rounded-full transition-all ${i === currentStep
                                ? "bg-violet-600 scale-125"
                                : completedSteps.has(s.id)
                                    ? "bg-green-500"
                                    : "bg-slate-300 dark:bg-slate-600 hover:bg-slate-400"
                                }`}
                            aria-label={`Go to step ${i + 1}: ${s.title}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

"use client";

import { Pricing as PricingBlock } from "@/components/pricing";

const tutorlyPlans = [
    {
        name: "STUDENT",
        price: "0",
        yearlyPrice: "0",
        period: "forever",
        features: [
            "Browse all tutors",
            "Book 1-on-1 lessons",
            "Join group sessions",
            "Message tutors",
            "Leave reviews",
        ],
        description: "Perfect for learners ready to improve",
        buttonText: "Start Learning",
        href: "/register?role=student",
        isPopular: true,
        accent: "violet" as const,
    },
    {
        name: "TEACHER",
        price: "0",
        yearlyPrice: "0",
        customPriceText: "Earn per lesson",
        period: "",
        features: [
            "Create your profile",
            "Manage availability",
            "1-on-1 & group lessons",
            "Automatic payments",
            "Student analytics",
        ],
        description: "Share your knowledge and earn",
        buttonText: "Start Teaching",
        href: "/register?role=teacher",
        isPopular: false,
        accent: "emerald" as const,
    },

];

export function Pricing() {
    return (
        <section id="pricing" className="py-24 bg-slate-50 dark:bg-slate-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[800px] overflow-hidden">
                <PricingBlock
                    plans={tutorlyPlans}
                    title="Simple, Transparent Pricing"
                    description="Choose the plan that works for you. No hidden fees."
                />
            </div>
        </section>
    );
}

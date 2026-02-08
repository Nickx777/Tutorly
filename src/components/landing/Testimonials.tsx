"use client";

import { TestimonialsColumn } from "@/components/testimonials-columns-1";
import { motion } from "framer-motion";

const testimonials = [
    {
        text: "Tutorly helped me pass my MCAT with flying colors! My tutor was incredibly knowledgeable and adapted the lessons to my learning style perfectly.",
        image: "https://randomuser.me/api/portraits/women/1.jpg",
        name: "Sarah Mitchell",
        role: "Medical Student",
    },
    {
        text: "The SAT prep I received was phenomenal. My score improved by 200 points! The scheduling flexibility made it easy to fit lessons around school.",
        image: "https://randomuser.me/api/portraits/men/2.jpg",
        name: "James Rodriguez",
        role: "High School Senior",
    },
    {
        text: "Learning Mandarin through Tutorly has been amazing. Native-speaking tutors, flexible scheduling, and great video quality.",
        image: "https://randomuser.me/api/portraits/women/3.jpg",
        name: "Emily Chen",
        role: "Software Engineer",
    },
    {
        text: "As a tutor, Tutorly has been a game-changer. The platform handles scheduling, payments, and recordings seamlessly. I can focus on teaching.",
        image: "https://randomuser.me/api/portraits/men/4.jpg",
        name: "Dr. Michael Brown",
        role: "Tutor - Mathematics",
    },
    {
        text: "My kids love their tutors! The platform is safe and the tutors are all verified. Progress tracking helps us see their improvement.",
        image: "https://randomuser.me/api/portraits/women/5.jpg",
        name: "Lisa Thompson",
        role: "Parent",
    },
    {
        text: "Best platform for language learning. I've tried many apps, but 1-on-1 tutoring here made the difference.",
        image: "https://randomuser.me/api/portraits/women/6.jpg",
        name: "Aliza Khan",
        role: "Language Learner",
    },
];

const firstColumn = testimonials.slice(0, 2);
const secondColumn = testimonials.slice(2, 4);
const thirdColumn = testimonials.slice(4, 6);

export function Testimonials() {
    return (
        <section id="testimonials" className="bg-slate-50 dark:bg-slate-950 py-24 relative">
            <div className="max-w-7xl relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center justify-center max-w-[540px] mx-auto text-center"
                >
                    <div className="flex justify-center">
                        <div className="border border-slate-200 dark:border-zinc-700 py-1 px-4 rounded-full text-slate-700 dark:text-zinc-300 text-sm">Testimonials</div>
                    </div>

                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mt-5 text-slate-900 dark:text-white">
                        What our users say
                    </h2>
                    <p className="text-center mt-4 text-slate-600 dark:text-zinc-400 opacity-75">
                        See what our community has to say about us.
                    </p>
                </motion.div>

                <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
                    <TestimonialsColumn testimonials={firstColumn} duration={15} />
                    <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
                    <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
                </div>
            </div>
        </section>
    );
}

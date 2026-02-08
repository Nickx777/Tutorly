"use client";

import { FeaturesSectionWithHoverEffects } from "@/components/feature-section-with-hover-effects";

export function Features() {
    return (
        <section id="features" className="pt-8 pb-24 bg-slate-50 dark:bg-slate-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <span className="text-sm font-semibold text-slate-500 dark:text-zinc-500 tracking-wider uppercase">
                        Features
                    </span>
                    <h2 className="mt-3 text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white">
                        Everything You Need to <span className="text-slate-500 dark:text-zinc-400">Succeed</span>
                    </h2>
                </div>
                <FeaturesSectionWithHoverEffects />
            </div>
        </section>
    );
}

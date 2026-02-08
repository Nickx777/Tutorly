"use client";

import { FloatingThemeToggle } from "@/components/theme";

interface LandingPageWrapperProps {
    children: React.ReactNode;
}

export function LandingPageWrapper({ children }: LandingPageWrapperProps) {
    return (
        <>
            {children}
            <FloatingThemeToggle />
        </>
    );
}

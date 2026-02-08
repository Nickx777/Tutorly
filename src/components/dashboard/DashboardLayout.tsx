"use client";

import { useState } from "react";
import { HorizonSidebar } from "@/components/horizon/sidebar/HorizonSidebar";
import { HorizonNavbar } from "@/components/horizon/navbar/HorizonNavbar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
    children: React.ReactNode;
    userRole: "teacher" | "student" | "admin";
    userName: string;
    userEmail?: string;
    userAvatar?: string;
}

export function DashboardLayout({
    children,
    userRole,
    userName,
    userEmail,
    userAvatar,
}: DashboardLayoutProps) {
    const [open, setOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
            {/* Sidebar */}
            <HorizonSidebar
                userRole={userRole}
                userName={userName}
                userEmail={userEmail}
                userAvatar={userAvatar}
                open={open}
                setOpen={setOpen}
            />

            {/* Main Content */}
            <div className="xl:ml-[280px] min-h-screen">
                {/* Navbar */}
                <div className="sticky top-0 z-30 bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
                    <div className="px-4 py-4">
                        <HorizonNavbar
                            onOpenSidenav={() => setOpen(true)}
                            brandText="Dashboard"
                            userName={userName}
                            userRole={userRole}
                            userAvatar={userAvatar}
                        />
                    </div>
                </div>

                {/* Page Content */}
                <div className="p-6">
                    <main>
                        {children}
                    </main>
                </div>
            </div>

        </div>
    );
}

export default DashboardLayout;

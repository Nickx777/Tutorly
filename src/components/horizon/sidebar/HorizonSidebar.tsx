"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useCallback } from "react";
import {
    LayoutDashboard,
    BookOpen,
    Calendar,
    DollarSign,
    Star,
    Settings,
    User,
    LogOut,
    GraduationCap,
    Users,
    X,
    FileText,
    BarChart3,
    Shield,
    Clock,
    ChevronRight,
    CreditCard,
    MessageSquare,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { getUnreadMessagesCount } from "@/lib/db";
import { useEffect, useState } from "react";

interface NavItem {
    name: string;
    path: string;
    icon: React.ReactNode;
    badge?: string | number;
    isMessage?: boolean;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

// Student navigation sections
const studentSections: NavSection[] = [
    {
        title: "GENERAL",
        items: [
            { name: "Dashboard", path: "/student", icon: <LayoutDashboard className="h-5 w-5" /> },
            { name: "My Lessons", path: "/student/my-lessons", icon: <BookOpen className="h-5 w-5" /> },
            { name: "Find Tutors", path: "/browse", icon: <GraduationCap className="h-5 w-5" /> },
            { name: "Calendar", path: "/student/calendar", icon: <Calendar className="h-5 w-5" /> },
            { name: "Messages", path: "/student/messages", icon: <MessageSquare className="h-5 w-5" />, isMessage: true },
        ],
    },
    {
        title: "ACCOUNT",
        items: [
            { name: "Payments", path: "/student/payments", icon: <CreditCard className="h-5 w-5" /> },
            { name: "Settings", path: "/student/settings", icon: <Settings className="h-5 w-5" /> },
        ],
    },
];

// Teacher navigation sections
const teacherSections: NavSection[] = [
    {
        title: "GENERAL",
        items: [
            { name: "Dashboard", path: "/teacher", icon: <LayoutDashboard className="h-5 w-5" /> },
            { name: "Lessons", path: "/teacher/lessons", icon: <BookOpen className="h-5 w-5" /> },
            { name: "Availability", path: "/teacher/availability", icon: <Calendar className="h-5 w-5" /> },
            { name: "Students", path: "/teacher/students", icon: <Users className="h-5 w-5" /> },
            { name: "Messages", path: "/teacher/messages", icon: <MessageSquare className="h-5 w-5" />, isMessage: true },
        ],
    },
    {
        title: "EARNINGS",
        items: [
            { name: "Earnings", path: "/teacher/earnings", icon: <DollarSign className="h-5 w-5" /> },
            { name: "Reviews", path: "/teacher/reviews", icon: <Star className="h-5 w-5" /> },
        ],
    },
    {
        title: "ACCOUNT",
        items: [
            { name: "Profile", path: "/teacher/profile", icon: <User className="h-5 w-5" /> },
            { name: "Settings", path: "/teacher/settings", icon: <Settings className="h-5 w-5" /> },
        ],
    },
];

// Admin navigation sections
const adminSections: NavSection[] = [
    {
        title: "GENERAL",
        items: [
            { name: "Dashboard", path: "/admin", icon: <LayoutDashboard className="h-5 w-5" /> },
            { name: "Users", path: "/admin/users", icon: <Users className="h-5 w-5" /> },
            { name: "Lessons", path: "/admin/lessons", icon: <BookOpen className="h-5 w-5" /> },
        ],
    },
    {
        title: "MANAGEMENT",
        items: [
            { name: "Analytics", path: "/admin/analytics", icon: <BarChart3 className="h-5 w-5" /> },
            { name: "Transactions", path: "/admin/transactions", icon: <DollarSign className="h-5 w-5" /> },
            { name: "Reports", path: "/admin/reports", icon: <FileText className="h-5 w-5" /> },
        ],
    },
    {
        title: "SYSTEM",
        items: [
            { name: "System Check", path: "/admin/system", icon: <Shield className="h-5 w-5" /> },
            { name: "Settings", path: "/admin/settings", icon: <Settings className="h-5 w-5" /> },
        ],
    },
];

interface HorizonSidebarProps {
    userRole: "student" | "teacher" | "admin";
    userName: string;
    userEmail?: string;
    userAvatar?: string;
    open: boolean;
    setOpen: (open: boolean) => void;
}

export function HorizonSidebar({ userRole, userName, userEmail, userAvatar, open, setOpen }: HorizonSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        let isMounted = true;

        async function fetchUnreadCount() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user && isMounted) {
                    const count = await getUnreadMessagesCount(user.id);
                    if (isMounted) setUnreadCount(count);

                    const channel = supabase
                        .channel('sidebar-messages')
                        .on(
                            'postgres_changes',
                            {
                                event: '*',
                                schema: 'public',
                                table: 'messages'
                            },
                            () => {
                                if (isMounted) {
                                    getUnreadMessagesCount(user.id).then(count => {
                                        if (isMounted) setUnreadCount(count);
                                    });
                                }
                            }
                        )
                        .subscribe();

                    // Listen for local updates (e.g., from MessageCenter)
                    const handleMessageUpdate = () => {
                        if (isMounted) {
                            getUnreadMessagesCount(user.id).then(count => {
                                if (isMounted) setUnreadCount(count);
                            });
                        }
                    };
                    window.addEventListener('messages:updated', handleMessageUpdate);

                    return () => {
                        window.removeEventListener('messages:updated', handleMessageUpdate);
                        supabase.removeChannel(channel);
                    };
                }
            } catch (err: any) {
                // Aggressively silence AbortErrors and expected auth/unmount interruptions
                if (
                    err?.name === 'AbortError' ||
                    err?.message?.includes('aborted') ||
                    err?.message?.includes('Auth session missing')
                ) {
                    return;
                }
                console.error("Error in fetchUnreadCount:", err);
            }
        }

        fetchUnreadCount();
        return () => {
            isMounted = false;
        };
    }, [supabase]);

    const sections = userRole === "teacher" ? teacherSections : userRole === "admin" ? adminSections : studentSections;

    const isActive = useCallback(
        (routePath: string) => {
            return pathname === routePath;
        },
        [pathname]
    );

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    return (
        <>
            {/* Mobile overlay */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 xl:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            <div
                className={cn(
                    "fixed z-50 flex h-full flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out",
                    "w-[280px]",
                    open ? "translate-x-0" : "-translate-x-full xl:translate-x-0"
                )}
            >
                {/* Close button for mobile */}
                <button
                    className="absolute right-3 top-3 block cursor-pointer xl:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    onClick={() => setOpen(false)}
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Logo */}
                <div className="px-6 py-6">
                    <Link href="/" className="flex items-center">
                        <Image
                            src="/cropped.png"
                            alt="Tutorly"
                            width={160}
                            height={44}
                            className="h-9 w-auto object-contain"
                            priority
                        />
                    </Link>
                </div>

                {/* Navigation Sections */}
                <nav className="flex-1 overflow-y-auto px-4 pb-4">
                    {sections.map((section, sectionIdx) => (
                        <div key={section.title} className={cn(sectionIdx > 0 && "mt-6")}>
                            <p className="px-3 mb-2 text-xs font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                                {section.title}
                            </p>
                            <ul className="space-y-1">
                                {section.items.map((item) => (
                                    <li key={item.path}>
                                        <Link
                                            href={item.path}
                                            onClick={() => setOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                                isActive(item.path)
                                                    ? "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400"
                                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                                            )}
                                        >
                                            <span className={cn(
                                                isActive(item.path)
                                                    ? "text-violet-600 dark:text-violet-400"
                                                    : "text-slate-400 dark:text-slate-500"
                                            )}>
                                                {item.icon}
                                            </span>
                                            <span className="flex-1">{item.name}</span>
                                            {item.isMessage && unreadCount > 0 && (
                                                <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full animate-pulse">
                                                    {unreadCount}
                                                </span>
                                            )}
                                            {item.badge && (
                                                <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
                                                    {item.badge}
                                                </span>
                                            )}
                                            {isActive(item.path) && (
                                                <ChevronRight className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                            )}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </nav>

                {/* User Profile Card */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        {/* Avatar */}
                        {userAvatar ? (
                            <img
                                src={userAvatar}
                                alt={userName}
                                className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-semibold text-sm">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                        )}

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{userName}</p>
                            {userEmail && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{userEmail}</p>
                            )}
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Sign out"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default HorizonSidebar;

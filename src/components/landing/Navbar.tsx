"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LayoutDashboard, LogOut, User as UserIcon } from "lucide-react";
import { Button, Avatar } from "@/components/ui";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#pricing", label: "Pricing" },
    { href: "#testimonials", label: "Testimonials" },
];

export function Navbar() {
    const pathname = usePathname() || "/"; // Default to / if pathname is null
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [user, setUser] = useState<Session["user"] | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const onScroll = () => {
            setIsScrolled(window.scrollY > 28);
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });

        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        const checkUser = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    setUser(session.user);
                    // Fetch user role
                    const { data: profile } = await supabase
                        .from("users")
                        .select("role")
                        .eq("id", session.user.id)
                        .single();

                    if (profile) {
                        setUserRole(profile.role);
                    }
                }
            } catch (error) {
                console.error("Error checking auth:", error);
            } finally {
                setLoading(false);
            }
        };

        checkUser();

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
            if (session?.user) {
                setUser(session.user);
                const { data: profile } = await supabase
                    .from("users")
                    .select("role")
                    .eq("id", session.user.id)
                    .single();
                setUserRole(profile?.role || null);
            } else {
                setUser(null);
                setUserRole(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
    };

    const getDashboardLink = () => {
        if (!userRole) return "/student";
        return `/${userRole}`; // /student, /teacher, or /admin
    };

    const getHref = (href: string) => {
        if (href.startsWith("#") && pathname !== "/") {
            return `/${href}`;
        }
        return href;
    };

    return (
        <header className={`fixed left-0 right-0 z-50 transition-[top] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isScrolled ? "top-2" : "top-4"}`}>
            <nav className={`liquid-glass rounded-2xl px-6 sm:px-7 overflow-visible mx-auto transition-[width,padding,box-shadow,background-color,backdrop-filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${isScrolled ? "w-[84%] sm:w-[68%] lg:w-[52%] py-2" : "w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] py-2.5"}`}>
                <div className="flex items-center max-w-7xl mx-auto">
                    {/* Logo */}
                    <Link href="/" className={`relative block overflow-visible transition-[width,height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isScrolled ? "h-12 w-40 sm:h-14 sm:w-44" : "h-12 w-40 sm:h-14 sm:w-44"}`}>
                        <Image
                            src="/logo-full.png"
                            alt="Tutorly"
                            fill
                            className={`object-contain object-left origin-left will-change-transform transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isScrolled ? "translate-y-0.5 sm:translate-y-1 scale-[2.15] sm:scale-[2.3]" : "translate-y-0.5 sm:translate-y-1 scale-[2.15] sm:scale-[2.3]"}`}
                            sizes="(max-width: 640px) 176px, 208px"
                            priority
                        />
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8 ml-60">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={getHref(link.href)}
                                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Desktop CTA */}
                    <div className="hidden md:flex items-center gap-3 ml-auto">
                        {!loading && (
                            user ? (
                                <div className="flex items-center gap-4">
                                    <Button variant="ghost" asChild className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
                                        <Link href="/browse">Browse Tutors</Link>
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="flex items-center gap-2 outline-none group">
                                                <Avatar
                                                    src={user.user_metadata?.avatar_url}
                                                    fallback={user.user_metadata?.full_name || user.email}
                                                    className="border-2 border-transparent group-hover:border-zinc-500 transition-all"
                                                />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">
                                            <DropdownMenuLabel>
                                                <div className="flex flex-col space-y-1">
                                                    <p className="text-sm font-medium leading-none text-slate-900 dark:text-slate-100">{user.user_metadata?.full_name}</p>
                                                    <p className="text-xs leading-none text-slate-500 dark:text-slate-500">{user.email}</p>
                                                </div>
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-800" />
                                            <DropdownMenuItem asChild className="focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-white cursor-pointer">
                                                <Link href={getDashboardLink()}>
                                                    <LayoutDashboard className="mr-2 h-4 w-4" />
                                                    Dashboard
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild className="focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-white cursor-pointer">
                                                <Link href={`${getDashboardLink()}/settings`}>
                                                    <UserIcon className="mr-2 h-4 w-4" />
                                                    Profile Settings
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-800" />
                                            <DropdownMenuItem onClick={handleSignOut} className="text-slate-900 dark:text-white focus:text-slate-900 dark:focus:text-white focus:bg-slate-100 dark:focus:bg-white/10 cursor-pointer">
                                                <LogOut className="mr-2 h-4 w-4" />
                                                Log out
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ) : (
                                <>
                                    <Button variant="ghost" asChild className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
                                        <Link href="/login">Sign In</Link>
                                    </Button>
                                    <ShimmerButton
                                        type="button"
                                        onClick={() => router.push("/register")}
                                        background="rgba(255,255,255,1)"
                                        shimmerColor="#000000"
                                        className="h-10 px-5 shadow-2xl text-slate-900"
                                    >
                                        Get Started
                                    </ShimmerButton>
                                </>
                            )
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden ml-auto p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-transform z-50 relative"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label={isOpen ? "Close menu" : "Open menu"}
                        type="button"
                    >
                        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden overflow-hidden"
                        >
                            <div className="pt-6 pb-4 space-y-4">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={getHref(link.href)}
                                        className="block text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                                <div className="pt-4 flex flex-col gap-3">
                                    {user ? (
                                        <>
                                            <div className="flex items-center gap-3 px-2 py-2 mb-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                                                <Avatar
                                                    src={user.user_metadata?.avatar_url}
                                                    fallback={user.user_metadata?.full_name || user.email}
                                                    size="sm"
                                                />
                                                <div className="flex-col flex">
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{user.user_metadata?.full_name}</span>
                                                    <span className="text-xs text-slate-500 dark:text-slate-500 capitalize">{userRole}</span>
                                                </div>
                                            </div>
                                            <Button asChild className="w-full bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-zinc-200">
                                                <Link href={getDashboardLink()}>
                                                    <LayoutDashboard className="mr-2 h-4 w-4" />
                                                    Go to Dashboard
                                                </Link>
                                            </Button>
                                            <Button variant="outline" onClick={handleSignOut} className="w-full border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20">
                                                <LogOut className="mr-2 h-4 w-4" />
                                                Sign Out
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button variant="outline" asChild className="w-full border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white">
                                                <Link href="/login">Sign In</Link>
                                            </Button>
                                            <ShimmerButton
                                                type="button"
                                                onClick={() => {
                                                    setIsOpen(false);
                                                    router.push("/register");
                                                }}
                                                background="rgba(255,255,255,1)"
                                                shimmerColor="#000000"
                                                className="w-full shadow-2xl text-slate-900"
                                            >
                                                Get Started
                                            </ShimmerButton>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        </header>
    );
}

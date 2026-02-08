"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function LoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginInput) => {
        try {
            setError(null);

            if (!isSupabaseConfigured()) {
                setError("Supabase is not configured. Please add your Supabase credentials to .env.local to enable authentication.");
                return;
            }

            const supabase = createClient();

            const { error: authError } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (authError) {
                setError(authError.message);
                return;
            }

            const { data: profile } = await supabase.from("users").select("role").single();

            if (profile?.role === "teacher") {
                router.push("/teacher");
            } else if (profile?.role === "admin") {
                router.push("/admin");
            } else {
                router.push("/student");
            }
        } catch {
            setError("Something went wrong. Please try again.");
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${location.origin}/auth/callback`,
                    queryParams: {
                        access_type: "offline",
                        prompt: "consent",
                    },
                },
            });

            if (error) {
                setError(error.message);
            }
        } catch {
            setError("Failed to initiate Google login");
        }
    };

    return (
        <div className="relative min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <Link
                href="/"
                aria-label="Back to home"
                className="absolute left-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/80 text-slate-700 dark:text-slate-100 backdrop-blur-md transition hover:bg-white dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white sm:left-6 sm:top-6 shadow-sm"
            >
                <ArrowLeft className="h-5 w-5" />
            </Link>

            <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
                <ThemeToggle />
            </div>

            <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/65 p-6 sm:p-8 backdrop-blur-xl shadow-xl dark:shadow-2xl dark:shadow-black/35"
                >
                    <Link href="/" className="mb-7 block">
                        <div className="relative h-12 w-44 sm:h-14 sm:w-48">
                            <Image src="/logo-tight.png" alt="Tutorly" fill className="object-contain object-left" />
                        </div>
                    </Link>

                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome back</h1>
                    <p className="text-slate-600 dark:text-slate-300 mb-8">Enter your credentials to access your account</p>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 text-sm"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <Label htmlFor="email" className="text-slate-700 dark:text-slate-100">Email</Label>
                            <div className="relative mt-1.5">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    className="pl-12 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:border-violet-500 transition-colors"
                                    error={errors.email?.message}
                                    {...register("email")}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <Label htmlFor="password" className="text-slate-700 dark:text-slate-100">Password</Label>
                                <Link href="/forgot-password" className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="pl-12 pr-12 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:border-violet-500 transition-colors"
                                    error={errors.password?.message}
                                    {...register("password")}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-lg shadow-slate-900/20 dark:shadow-none" size="lg" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white/70 dark:bg-slate-900 text-slate-500 dark:text-slate-400 backdrop-blur-xl">Or continue with</span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-4">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={handleGoogleLogin}
                                className="w-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950/70 text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Google
                            </Button>
                        </div>
                    </div>

                    <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        Don&apos;t have an account? <Link href="/register" className="text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 font-medium transition-colors">Sign up for free</Link>
                    </p>
                </motion.div>
            </div>

            <div className="hidden lg:block lg:flex-1 relative overflow-hidden bg-slate-900 dark:bg-black">
                <div className="absolute inset-0 animated-gradient opacity-90" />
                <div className="absolute inset-0 flex items-center justify-center p-12">
                    <div className="text-center text-white">
                        <h2 className="text-4xl font-bold mb-4">Start Learning Today</h2>
                        <p className="text-xl text-white/80 max-w-md">
                            Connect with expert tutors and unlock your full potential with personalized lessons.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}


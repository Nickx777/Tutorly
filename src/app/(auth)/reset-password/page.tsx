"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, ArrowLeft, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [validHash, setValidHash] = useState(false);

    useEffect(() => {
        const checkSession = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setValidHash(true); // Re-using this state variable name for "valid session/access"
            } else {
                // Fallback: Check hash if somehow we got here via implicit flow (unlikely with SSR)
                const hash = window.location.hash;
                if (hash && hash.includes("type=recovery")) {
                    setValidHash(true);
                }
            }
        };
        checkSession();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setLoading(true);

        if (!isSupabaseConfigured()) {
            setError("Supabase is not configured.");
            setLoading(false);
            return;
        }

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) {
                setError(error.message);
            } else {
                setSuccess(true);
                setTimeout(() => {
                    router.push("/login");
                }, 2000);
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!validHash && !success) {
        return (
            <div className="relative min-h-screen flex bg-slate-950">
                <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/65 p-6 sm:p-8 backdrop-blur-xl text-center"
                    >
                        <h1 className="text-2xl font-bold text-white mb-4">Invalid or expired link</h1>
                        <p className="text-slate-300 mb-6">
                            This password reset link is invalid or has expired.
                        </p>
                        <Button asChild className="bg-white text-slate-900 hover:bg-slate-200">
                            <Link href="/forgot-password">Request new link</Link>
                        </Button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen flex bg-slate-950">
            <Link
                href="/login"
                aria-label="Back to login"
                className="absolute left-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-950/80 text-slate-100 backdrop-blur-md transition hover:bg-slate-900 hover:text-white sm:left-6 sm:top-6"
            >
                <ArrowLeft className="h-5 w-5" />
            </Link>

            <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/65 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/35"
                >
                    <Link href="/" className="mb-7 block">
                        <div className="relative h-12 w-44 sm:h-14 sm:w-48">
                            <Image src="/logo-tight.png" alt="Tutorly" fill className="object-contain object-left" />
                        </div>
                    </Link>

                    {!success ? (
                        <>
                            <h1 className="text-3xl font-bold text-white mb-2">Create new password</h1>
                            <p className="text-slate-300 mb-8">
                                Enter your new password below.
                            </p>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <Label htmlFor="password" className="text-slate-100">New Password</Label>
                                    <div className="relative mt-1.5">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-12 pr-12 border-slate-700 bg-slate-950/80 text-slate-100 placeholder:text-slate-500 focus-visible:border-violet-500"
                                            required
                                            minLength={8}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="confirmPassword" className="text-slate-100">Confirm Password</Label>
                                    <div className="relative mt-1.5">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                        <Input
                                            id="confirmPassword"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="pl-12 border-slate-700 bg-slate-950/80 text-slate-100 placeholder:text-slate-500 focus-visible:border-violet-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-white text-slate-900 hover:bg-slate-200"
                                    size="lg"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                            Updating...
                                        </>
                                    ) : (
                                        "Reset password"
                                    )}
                                </Button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="h-8 w-8 text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Password updated!</h2>
                            <p className="text-slate-300 mb-6">
                                Your password has been successfully reset. Redirecting to login...
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

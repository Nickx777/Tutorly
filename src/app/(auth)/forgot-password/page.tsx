"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (!isSupabaseConfigured()) {
            setError("Supabase is not configured.");
            setLoading(false);
            return;
        }

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                setError(error.message);
            } else {
                setSent(true);
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

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

                    {!sent ? (
                        <>
                            <h1 className="text-3xl font-bold text-white mb-2">Reset your password</h1>
                            <p className="text-slate-300 mb-8">
                                Enter your email address and we&apos;ll send you a link to reset your password.
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
                                    <Label htmlFor="email" className="text-slate-100">Email</Label>
                                    <div className="relative mt-1.5">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
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
                                            Sending...
                                        </>
                                    ) : (
                                        "Send reset link"
                                    )}
                                </Button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="h-8 w-8 text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
                            <p className="text-slate-300 mb-6">
                                We&apos;ve sent a password reset link to <strong>{email}</strong>
                            </p>
                            <Button variant="outline" asChild className="border-slate-700 text-slate-300 hover:bg-slate-800">
                                <Link href="/login">Back to login</Link>
                            </Button>
                        </div>
                    )}

                    <p className="mt-8 text-center text-sm text-slate-400">
                        Remember your password?{" "}
                        <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium">Sign in</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

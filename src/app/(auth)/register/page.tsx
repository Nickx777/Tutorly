"use client";

import Image from "next/image";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, ArrowLeft, Loader2, BookOpen, Users, Shield, CheckCircle } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { OTPInput } from "@/components/auth/otp-input";
import { type RegisterInput, registerSchema } from "@/lib/validations/auth";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const defaultRole = searchParams.get("role") as "student" | "teacher" | null;

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [verifying, setVerifying] = useState(false);
    const [otpValue, setOtpValue] = useState("");
    const [pendingEmail, setPendingEmail] = useState("");
    const [pendingData, setPendingData] = useState<RegisterInput | null>(null);
    const [showCodeInput, setShowCodeInput] = useState(false);
    const [resendingCode, setResendingCode] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            role: defaultRole || undefined,
        },
    });

    const selectedRole = watch("role");

    const onSubmit = async (data: RegisterInput) => {
        try {
            setError(null);

            if (!isSupabaseConfigured()) {
                setError("Supabase is not configured.");
                return;
            }

            const supabase = createClient();

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        full_name: data.fullName,
                        role: data.role,
                    },
                    emailRedirectTo: `${location.origin}/auth/callback`,
                },
            });

            if (authError) {
                setError(authError.message);
                return;
            }

            if (authData.user) {
                setPendingEmail(data.email);
                setPendingData(data);

                if (authData.user.email_confirmed_at) {
                    await completeRegistration(authData.user.id, data);
                } else {
                    setVerifying(true);
                }
            }
        } catch (err: any) {
            setError("Something went wrong. Please try again.");
        }
    };

    const handleVerifyOTP = async () => {
        try {
            setError(null);
            const supabase = createClient();

            const { data: { user }, error: verifyError } = await supabase.auth.verifyOtp({
                email: pendingEmail,
                token: otpValue,
                type: "signup",
            });

            if (verifyError) {
                setError(verifyError.message);
                return;
            }

            if (user && pendingData) {
                await completeRegistration(user.id, pendingData);
            }
        } catch (err: any) {
            setError("Verification failed. Please try again.");
        }
    };

    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const resendCode = async () => {
        if (countdown > 0) return;

        try {
            setError(null);
            setResendingCode(true);
            const supabase = createClient();

            const { error: resendError } = await supabase.auth.resend({
                type: 'signup',
                email: pendingEmail,
                options: {
                    emailRedirectTo: `${location.origin}/auth/callback`,
                }
            });

            if (resendError) {
                if (resendError.message?.includes("too many requests") || resendError.status === 429) {
                    setError("Too many attempts. Please wait a moment.");
                } else {
                    setError(resendError.message);
                }
            } else {
                setCountdown(60); // Start 60s cooldown on success
            }
        } catch (err: any) {
            setError("Failed to resend code. Please try again.");
        } finally {
            setResendingCode(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${location.origin}/auth/callback?role=${selectedRole || 'student'}`,
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
            setError("Failed to initiate Google signup");
        }
    };

    const completeRegistration = async (userId: string, data: RegisterInput) => {
        const supabase = createClient();

        const { error: userError } = await supabase.from("users").insert({
            id: userId,
            email: data.email,
            full_name: data.fullName,
            role: data.role,
        });

        if (userError) {
            console.error("Error creating user:", userError);
            setError("Failed to create profile. Please try again.");
            return;
        }

        if (data.role === "teacher") {
            await supabase.from("teacher_profiles").insert({
                user_id: userId,
                approved: false,
            });
        }

        router.push(data.role === "teacher" ? "/teacher" : "/student");
    };

    const switchToCodeInput = async () => {
        setShowCodeInput(true);
    };

    // Verification Screen
    if (verifying) {
        return (
            <div className="relative min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
                <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/65 p-6 sm:p-8 backdrop-blur-xl shadow-xl dark:shadow-2xl dark:shadow-black/35 text-center"
                    >
                        <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center mx-auto mb-6">
                            <Shield className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                        </div>

                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Verify your email</h1>
                        <p className="text-slate-600 dark:text-slate-300 mb-6">
                            We&apos;ve sent a verification link to<br />
                            <strong className="text-slate-900 dark:text-white">{pendingEmail}</strong>
                        </p>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 text-sm"
                            >
                                {error}
                            </motion.div>
                        )}

                        {showCodeInput ? (
                            <>
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-100 dark:border-transparent">
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                                        Enter the 8-digit code from your email
                                    </p>
                                    <OTPInput
                                        value={otpValue}
                                        onChange={setOtpValue}
                                        length={8}
                                    />
                                </div>

                                <Button
                                    onClick={handleVerifyOTP}
                                    className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 mb-4 transition-colors shadow-lg shadow-slate-900/20 dark:shadow-none"
                                    size="lg"
                                    disabled={otpValue.length !== 8}
                                >
                                    Verify Email
                                </Button>

                                <p className="text-slate-500 dark:text-slate-400 text-sm">
                                    Didn&apos;t receive it?{" "}
                                    <button
                                        onClick={resendCode}
                                        disabled={resendingCode || countdown > 0}
                                        className={`font-medium ${resendingCode || countdown > 0 ? "text-slate-400 dark:text-slate-500 cursor-not-allowed" : "text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300"}`}
                                    >
                                        {resendingCode ? "Sending..." : countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
                                    </button>
                                </p>

                                <button
                                    onClick={() => setShowCodeInput(false)}
                                    className="mt-4 text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm transition-colors"
                                >
                                    Back to email verification
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-100 dark:border-transparent">
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                                        Click the link in your email to verify.<br />
                                        <span className="text-slate-400 dark:text-slate-500 text-xs">You&apos;ll be logged in automatically.</span>
                                    </p>
                                </div>

                                <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4">
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                                        Didn&apos;t receive it?{" "}
                                        <button
                                            onClick={resendCode}
                                            disabled={resendingCode || countdown > 0}
                                            className={`font-medium ${resendingCode || countdown > 0 ? "text-slate-400 dark:text-slate-500 cursor-not-allowed" : "text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300"}`}
                                        >
                                            {resendingCode ? "Sending..." : countdown > 0 ? `Resend in ${countdown}s` : "Resend email"}
                                        </button>
                                    </p>

                                    <button
                                        onClick={switchToCodeInput}
                                        disabled={resendingCode}
                                        className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 text-sm flex items-center justify-center gap-2 mx-auto transition-colors"
                                    >
                                        {resendingCode ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Sending code...
                                            </>
                                        ) : (
                                            "Or enter verification code"
                                        )}
                                    </button>
                                </div>

                                <button
                                    onClick={() => setVerifying(false)}
                                    className="mt-6 text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm transition-colors"
                                >
                                    Go back
                                </button>
                            </>
                        )}
                    </motion.div>
                </div>
            </div>
        );
    }

    // Registration Form
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

            <div className="flex-1 flex items-center justify-center p-6 sm:p-8 overflow-y-auto">
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

                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Create your account</h1>
                    <p className="text-slate-600 dark:text-slate-300 mb-8">Join thousands of learners and tutors on Tutorly</p>

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
                            <Label className="text-slate-700 dark:text-slate-100">I want to</Label>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setValue("role", "student")}
                                    className={`p-4 rounded-xl border text-left transition-all ${selectedRole === "student"
                                        ? "border-emerald-500/70 bg-emerald-500/10 dark:bg-emerald-500/12 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]"
                                        : "border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/40 hover:border-emerald-300/40 hover:bg-emerald-50 dark:hover:bg-emerald-900/10"
                                        }`}
                                >
                                    <div
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${selectedRole === "student"
                                            ? "bg-emerald-500 text-white"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300"
                                            }`}
                                    >
                                        <BookOpen className="h-5 w-5" />
                                    </div>
                                    <div className={`font-semibold ${selectedRole === "student" ? "text-emerald-700 dark:text-emerald-300" : "text-slate-700 dark:text-slate-100"}`}>Learn</div>
                                    <div className={`text-sm ${selectedRole === "student" ? "text-emerald-600 dark:text-emerald-100/85" : "text-slate-500 dark:text-slate-400"}`}>Find tutors and book lessons</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setValue("role", "teacher")}
                                    className={`p-4 rounded-xl border text-left transition-all ${selectedRole === "teacher"
                                        ? "border-sky-500/70 bg-sky-500/10 dark:bg-sky-500/12 shadow-[0_0_0_1px_rgba(56,189,248,0.25)]"
                                        : "border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/40 hover:border-sky-300/40 hover:bg-sky-50 dark:hover:bg-sky-900/10"
                                        }`}
                                >
                                    <div
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${selectedRole === "teacher"
                                            ? "bg-sky-500 text-white"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300"
                                            }`}
                                    >
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <div className={`font-semibold ${selectedRole === "teacher" ? "text-sky-700 dark:text-sky-300" : "text-slate-700 dark:text-slate-100"}`}>Teach</div>
                                    <div className={`text-sm ${selectedRole === "teacher" ? "text-sky-600 dark:text-sky-100/85" : "text-slate-500 dark:text-slate-400"}`}>Share knowledge and earn</div>
                                </button>
                            </div>
                            {errors.role && <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{errors.role.message}</p>}
                        </div>

                        <div>
                            <Label htmlFor="fullName" className="text-slate-700 dark:text-slate-100">Full Name</Label>
                            <div className="relative mt-1.5">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
                                <Input
                                    id="fullName"
                                    type="text"
                                    placeholder="John Doe"
                                    className="pl-12 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:border-violet-500 transition-colors"
                                    error={errors.fullName?.message}
                                    {...register("fullName")}
                                />
                            </div>
                        </div>

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
                            <Label htmlFor="password" className="text-slate-700 dark:text-slate-100">Password</Label>
                            <div className="relative mt-1.5">
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

                        <div>
                            <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-slate-100">Confirm Password</Label>
                            <div className="relative mt-1.5">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
                                <Input
                                    id="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="pl-12 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:border-violet-500 transition-colors"
                                    error={errors.confirmPassword?.message}
                                    {...register("confirmPassword")}
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="agreeToTerms"
                                className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-violet-500 focus:ring-violet-500/30"
                                {...register("agreeToTerms")}
                            />
                            <label htmlFor="agreeToTerms" className="text-sm text-slate-400">
                                I agree to the {" "}
                                <Link href="/terms" className="text-violet-400 hover:text-violet-300">Terms of Service</Link>{" "}
                                and {" "}
                                <Link href="/privacy" className="text-violet-400 hover:text-violet-300">Privacy Policy</Link>
                            </label>
                        </div>
                        {errors.agreeToTerms && <p className="text-sm text-red-400">{errors.agreeToTerms.message}</p>}

                        <Button type="submit" className="w-full bg-white text-slate-900 hover:bg-slate-200" size="lg" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    Create Account
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
                                <span className="px-4 bg-white/70 dark:bg-slate-900 text-slate-500 dark:text-slate-400 backdrop-blur-xl">Or sign up with</span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-4">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={handleGoogleLogin}
                                className="w-full border-slate-700 bg-slate-950/70 text-slate-100 hover:bg-slate-900 hover:text-white"
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
                        Already have an account? {" "}
                        <Link href="/login" className="text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 font-medium transition-colors">Sign in</Link>
                    </p>
                </motion.div>
            </div>

            <div className="hidden lg:block lg:flex-1 relative overflow-hidden bg-slate-900 dark:bg-black">
                <div className="absolute inset-0 animated-gradient opacity-90 dark:opacity-80" />
                <div className="absolute inset-0 flex items-center justify-center p-12">
                    <div className="text-center text-white">
                        <h2 className="text-4xl font-bold mb-4">
                            {selectedRole === "teacher" ? "Share Your Expertise" : "Unlock Your Potential"}
                        </h2>
                        <p className="text-xl text-white/80 max-w-md">
                            {selectedRole === "teacher"
                                ? "Join our community of expert tutors and help students achieve their goals while earning on your own schedule."
                                : "Connect with world-class tutors and get personalized guidance to achieve your learning objectives."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500" />
            </div>
        }>
            <RegisterForm />
        </Suspense>
    );
}

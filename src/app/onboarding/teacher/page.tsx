"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import InteractiveTutorial from "@/components/onboarding/InteractiveTutorial";
import { toast } from "sonner";
import { Loader2, ArrowRight, CheckCircle2, Circle } from "lucide-react";

// Steps: 0 = Intro, 1 = Bio, 2 = Expertise, 3 = Target Grades, 4 = Rates, 5 = Zoom Integration
// After profile setup, show the interactive tutorial

const GRADES = [
    "Elementary School",
    "Middle School (6-8)",
    "High School - Freshman (9th)",
    "High School - Sophomore (10th)",
    "High School - Junior (11th)",
    "High School - Senior (12th)",
    "University / College",
    "Adult Learner",
];

export default function TeacherOnboarding() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);
    const [formData, setFormData] = useState({
        headline: "",
        bio: "",
        subjects: "", // comma separated string for input
        target_grades: [] as string[],
        hourly_rate: "30",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const toggleGrade = (grade: string) => {
        setFormData(prev => ({
            ...prev,
            target_grades: prev.target_grades.includes(grade)
                ? prev.target_grades.filter(g => g !== grade)
                : [...prev.target_grades, grade]
        }));
    };

    // Load existing profile if available
    useEffect(() => {
        async function loadProfile() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from("teacher_profiles")
                .select("*")
                .eq("user_id", user.id)
                .single();

            if (profile) {
                setFormData({
                    headline: "", // Not in DB yet
                    bio: profile.bio || "",
                    subjects: profile.subjects?.join(", ") || "",
                    target_grades: profile.target_grades || [],
                    hourly_rate: profile.hourly_rate?.toString() || "30",
                });
            }
        }
        loadProfile();
    }, []);

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleComplete = async () => {
        setLoading(true);
        const supabase = createClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            // Upsert teacher profile
            const subjectsArray = formData.subjects.split(',').map(s => s.trim()).filter(Boolean);

            const { error: profileError } = await supabase
                .from("teacher_profiles")
                .upsert({
                    user_id: user.id,
                    bio: formData.bio,
                    subjects: subjectsArray,
                    target_grades: formData.target_grades,
                    hourly_rate: parseFloat(formData.hourly_rate),
                    approved: false, // Ensure they need approval
                }, { onConflict: 'user_id' });

            if (profileError) throw profileError;

            toast.success("Profile created! Let's show you around.");
            setShowTutorial(true);

        } catch (error: any) {
            console.error("Teacher onboarding error:", error);
            toast.error("Failed to save profile: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTutorialComplete = async () => {
        const supabase = createClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user");

            // Update user metadata and column
            await supabase.auth.updateUser({
                data: { onboarding_completed: true }
            });

            await supabase
                .from("users")
                .update({ onboarding_completed: true })
                .eq("id", user.id);

            router.push("/teacher");
            router.refresh();
        } catch (error) {
            console.error("Error completing onboarding:", error);
            router.push("/teacher");
        }
    };

    // Show interactive tutorial after profile setup
    if (showTutorial) {
        return <InteractiveTutorial role="teacher" onComplete={handleTutorialComplete} />;
    }

    return (
        <OnboardingLayout>
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            className={`h-2 flex-1 rounded-full ${i <= step ? "bg-violet-600" : "bg-slate-200 dark:bg-slate-700"
                                }`}
                        />
                    ))}
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {step === 0 && "Welcome Instructor"}
                    {step === 1 && "About You"}
                    {step === 2 && "Your Expertise"}
                    {step === 3 && "Target Students"}
                    {step === 4 && "Set Your Rate"}
                    {step === 5 && "Video Integration"}
                </h2>
            </div>

            <div className="space-y-6">
                {step === 0 && (
                    <div className="space-y-4">
                        <p className="text-slate-600 dark:text-slate-400">
                            Thank you for joining Tutorly as an instructor! To get started, we need to set up your public profile so students can find you.
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <li>Set your bio and headline</li>
                            <li>List your subjects and target grades</li>
                            <li>Set your hourly rate</li>
                        </ul>
                    </div>
                )}

                {step === 1 && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="bio">Biography</Label>
                            <Textarea
                                id="bio"
                                name="bio"
                                placeholder="Tell students about your experience and teaching style..."
                                value={formData.bio}
                                onChange={handleChange}
                                className="min-h-[150px]"
                            />
                            <p className="text-xs text-slate-500">This will be displayed on your public profile.</p>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="subjects">Subjects (comma separated)</Label>
                            <Input
                                id="subjects"
                                name="subjects"
                                placeholder="e.g. Mathematics, Physics, Calculus"
                                value={formData.subjects}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Which grades do you want to teach?</Label>
                            <div className="grid grid-cols-1 gap-3">
                                {GRADES.map((grade) => (
                                    <button
                                        key={grade}
                                        onClick={() => toggleGrade(grade)}
                                        className={`flex items-center justify-between p-4 rounded-lg border text-sm font-medium transition-all ${formData.target_grades.includes(grade)
                                            ? "border-violet-600 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:border-violet-500 dark:text-violet-300"
                                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
                                            }`}
                                    >
                                        {grade}
                                        {formData.target_grades.includes(grade) ? (
                                            <CheckCircle2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                        ) : (
                                            <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="hourly_rate">Hourly Rate (€)</Label>
                            <Input
                                id="hourly_rate"
                                name="hourly_rate"
                                type="number"
                                min="0"
                                step="1"
                                value={formData.hourly_rate}
                                onChange={handleChange}
                            />
                            <p className="text-xs text-slate-500">You can change this later.</p>
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M16 16.5l4 3.5v-16l-4 3.5v9zM1 18h13V6H1v12z" />
                                    </svg>
                                </div>
                                <p className="font-semibold text-slate-900 dark:text-white">Zoom Meetings</p>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Connect Zoom to automatically generate secure meeting links for your lessons. If you skip this, you'll need to provide your own meeting links later.
                            </p>
                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => window.location.href = '/api/zoom/connect'}
                            >
                                Connect Zoom Account
                            </Button>
                        </div>
                        <p className="text-center text-xs text-slate-500">
                            You'll be redirected back here after connecting.
                        </p>
                    </div>
                )}

                <div className="flex gap-3 pt-4">
                    {step > 0 && (
                        <Button variant="outline" onClick={handleBack} disabled={loading} className="flex-1">
                            Back
                        </Button>
                    )}
                    {step < 4 ? (
                        <Button onClick={handleNext} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white">
                            Continue <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : step === 4 ? (
                        <Button onClick={handleNext} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white">
                            Continue <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        // Step 5 is the last step
                        <Button onClick={handleComplete} disabled={loading} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Profile"}
                        </Button>
                    )}
                </div>
            </div>
        </OnboardingLayout>
    );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { upsertStudentProfile } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import InteractiveTutorial from "@/components/onboarding/InteractiveTutorial";
import { CheckCircle2, Circle, ArrowRight, ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";

const SUBJECTS = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "English",
    "History",
    "Computer Science",
    "Art",
    "Music",
    "Economics",
    "Languages",
];

const LANGUAGES = [
    "English",
    "Spanish",
    "French",
    "German",
    "Chinese",
    "Japanese",
    "Arabic",
    "Russian",
    "Portuguese",
    "Italian",
    "Hindi",
    "Korean",
];

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

export default function StudentOnboarding() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
    const [selectedGrade, setSelectedGrade] = useState<string>("");
    const [customSubject, setCustomSubject] = useState("");
    const [customLanguage, setCustomLanguage] = useState("");
    const [showCustomSubject, setShowCustomSubject] = useState(false);
    const [showCustomLanguage, setShowCustomLanguage] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);

    const toggleSubject = (subject: string) => {
        setSelectedSubjects((prev) =>
            prev.includes(subject)
                ? prev.filter((s) => s !== subject)
                : [...prev, subject]
        );
    };

    const toggleLanguage = (language: string) => {
        setSelectedLanguages((prev) =>
            prev.includes(language)
                ? prev.filter((l) => l !== language)
                : [...prev, language]
        );
    };

    const addCustomSubject = () => {
        if (customSubject.trim() && !selectedSubjects.includes(customSubject.trim())) {
            setSelectedSubjects(prev => [...prev, customSubject.trim()]);
            setCustomSubject("");
            setShowCustomSubject(false);
        }
    };

    const addCustomLanguage = () => {
        if (customLanguage.trim() && !selectedLanguages.includes(customLanguage.trim())) {
            setSelectedLanguages(prev => [...prev, customLanguage.trim()]);
            setCustomLanguage("");
            setShowCustomLanguage(false);
        }
    };

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleComplete = async () => {
        setLoading(true);
        const supabase = createClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            // 1. Update Student Profile in DB (for recommendation algorithm)
            await upsertStudentProfile(user.id, {
                interests: selectedSubjects,
                languages: selectedLanguages,
                grade_level: selectedGrade,
            });

            // 2. Update user metadata
            await supabase.auth.updateUser({
                data: {
                    interests: selectedSubjects,
                    languages: selectedLanguages,
                    grade_level: selectedGrade,
                }
            });

            toast.success("Preferences saved! Let's show you around.");
            setShowTutorial(true);

        } catch (error: any) {
            console.error("Onboarding error:", error);
            toast.error("Failed to complete setup. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleTutorialComplete = async () => {
        const supabase = createClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user");

            // Mark onboarding as complete
            await supabase.auth.updateUser({
                data: { onboarding_completed: true }
            });

            await supabase
                .from("users")
                .update({ onboarding_completed: true })
                .eq("id", user.id);

            router.push("/student");
            router.refresh();
        } catch (error) {
            console.error("Error completing onboarding:", error);
            router.push("/student");
        }
    };

    // Show interactive tutorial after preferences are saved
    if (showTutorial) {
        return <InteractiveTutorial role="student" onComplete={handleTutorialComplete} />;
    }

    return (
        <OnboardingLayout>
            <div className="space-y-6">
                {/* Progress Indicators */}
                <div className="flex items-center gap-2 mb-4">
                    <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 1 ? "bg-violet-600" : "bg-slate-200"}`} />
                    <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 2 ? "bg-violet-600" : "bg-slate-200"}`} />
                    <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 3 ? "bg-violet-600" : "bg-slate-200"}`} />
                </div>

                {step === 1 && (
                    <>
                        <div>
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                                What do you want to learn?
                            </h3>
                            <p className="text-sm text-slate-500">
                                Select subjects you are interested in. We&apos;ll match you with the right tutors.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {SUBJECTS.map((subject) => (
                                <button
                                    key={subject}
                                    onClick={() => toggleSubject(subject)}
                                    className={`flex items-center justify-between p-3 rounded-lg border text-sm font-medium transition-all ${selectedSubjects.includes(subject)
                                        ? "border-violet-600 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:border-violet-500 dark:text-violet-300"
                                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
                                        }`}
                                >
                                    {subject}
                                    {selectedSubjects.includes(subject) ? (
                                        <CheckCircle2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                    ) : (
                                        <Circle className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Custom Subjects Added */}
                        {selectedSubjects.filter(s => !SUBJECTS.includes(s)).length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selectedSubjects.filter(s => !SUBJECTS.includes(s)).map((subject) => (
                                    <span
                                        key={subject}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 text-sm font-medium"
                                    >
                                        {subject}
                                        <button
                                            onClick={() => toggleSubject(subject)}
                                            className="ml-1 hover:text-violet-900 dark:hover:text-violet-100"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Other Option */}
                        {showCustomSubject ? (
                            <div className="flex gap-2">
                                <Input
                                    value={customSubject}
                                    onChange={(e) => setCustomSubject(e.target.value)}
                                    placeholder="Enter subject name..."
                                    className="flex-1"
                                    onKeyDown={(e) => e.key === 'Enter' && addCustomSubject()}
                                    autoFocus
                                />
                                <Button onClick={addCustomSubject} size="sm" className="bg-violet-600 hover:bg-violet-700">
                                    Add
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setShowCustomSubject(false)}>
                                    Cancel
                                </Button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowCustomSubject(true)}
                                className="flex items-center gap-2 p-3 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-500 dark:text-slate-400 hover:border-violet-300 hover:text-violet-600 dark:hover:border-violet-500 dark:hover:text-violet-400 transition-all w-full justify-center"
                            >
                                <Plus className="h-4 w-4" />
                                Other (Add Custom Subject)
                            </button>
                        )}

                        <div className="pt-4">
                            <Button
                                onClick={handleNext}
                                disabled={selectedSubjects.length === 0}
                                className="w-full bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center gap-2"
                            >
                                Next Step <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <div>
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                                What is your current grade/level?
                            </h3>
                            <p className="text-sm text-slate-500">
                                This helps us match you with tutors experienced in your level.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {GRADES.map((grade) => (
                                <button
                                    key={grade}
                                    onClick={() => setSelectedGrade(grade)}
                                    className={`flex items-center justify-between p-4 rounded-lg border text-sm font-medium transition-all ${selectedGrade === grade
                                        ? "border-violet-600 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:border-violet-500 dark:text-violet-300"
                                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
                                        }`}
                                >
                                    {grade}
                                    {selectedGrade === grade ? (
                                        <CheckCircle2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                    ) : (
                                        <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="pt-4 flex gap-3">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                className="flex-1"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" /> Back
                            </Button>
                            <Button
                                onClick={handleNext}
                                disabled={!selectedGrade}
                                className="flex-[2] bg-violet-600 hover:bg-violet-700 text-white"
                            >
                                Next Step <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </>
                )}

                {step === 3 && (
                    <>
                        <div>
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                                What languages do you speak?
                            </h3>
                            <p className="text-sm text-slate-500">
                                We&apos;ll match you with teachers who speak your language.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {LANGUAGES.map((language) => (
                                <button
                                    key={language}
                                    onClick={() => toggleLanguage(language)}
                                    className={`flex items-center justify-between p-3 rounded-lg border text-sm font-medium transition-all ${selectedLanguages.includes(language)
                                        ? "border-violet-600 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:border-violet-500 dark:text-violet-300"
                                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
                                        }`}
                                >
                                    {language}
                                    {selectedLanguages.includes(language) ? (
                                        <CheckCircle2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                    ) : (
                                        <Circle className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Custom Languages Added */}
                        {selectedLanguages.filter(l => !LANGUAGES.includes(l)).length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selectedLanguages.filter(l => !LANGUAGES.includes(l)).map((language) => (
                                    <span
                                        key={language}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 text-sm font-medium"
                                    >
                                        {language}
                                        <button
                                            onClick={() => toggleLanguage(language)}
                                            className="ml-1 hover:text-violet-900 dark:hover:text-violet-100"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Other Option */}
                        {showCustomLanguage ? (
                            <div className="flex gap-2">
                                <Input
                                    value={customLanguage}
                                    onChange={(e) => setCustomLanguage(e.target.value)}
                                    placeholder="Enter language name..."
                                    className="flex-1"
                                    onKeyDown={(e) => e.key === 'Enter' && addCustomLanguage()}
                                    autoFocus
                                />
                                <Button onClick={addCustomLanguage} size="sm" className="bg-violet-600 hover:bg-violet-700">
                                    Add
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setShowCustomLanguage(false)}>
                                    Cancel
                                </Button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowCustomLanguage(true)}
                                className="flex items-center gap-2 p-3 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-500 dark:text-slate-400 hover:border-violet-300 hover:text-violet-600 dark:hover:border-violet-500 dark:hover:text-violet-400 transition-all w-full justify-center"
                            >
                                <Plus className="h-4 w-4" />
                                Other (Add Custom Language)
                            </button>
                        )}

                        <div className="pt-4 flex gap-3">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                className="flex-1"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" /> Back
                            </Button>
                            <Button
                                onClick={handleComplete}
                                disabled={loading || selectedLanguages.length === 0}
                                className="flex-[2] bg-violet-600 hover:bg-violet-700 text-white"
                            >
                                {loading ? "Setting up..." : "Complete Setup"}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </OnboardingLayout>
    );
}

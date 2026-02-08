"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Search,
    Filter,
    Star,
    Clock,
    Globe,
    DollarSign,
    ChevronDown,
    X,
    ArrowLeft,
    Loader2,
    MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Card, CardContent, Badge, Avatar } from "@/components/ui";
import { Footer } from "@/components/landing";
import { FloatingThemeToggle } from "@/components/theme/FloatingThemeToggle";
import { browseTeachers } from "@/lib/db";

interface TeacherData {
    id: string;
    user_id: string;
    bio: string;
    subjects: string[];
    languages: string[];
    hourly_rate: number;
    average_rating?: number;
    total_reviews?: number;
    total_lessons?: number;
    user?: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
}

function BackButton() {
    const [backUrl, setBackUrl] = useState("/");
    const [backLabel, setBackLabel] = useState("Back to Home");

    useEffect(() => {
        const referrer = document.referrer;
        if (referrer && (referrer.includes("/student") || referrer.includes("/teacher") || referrer.includes("/admin"))) {
            const dashboardMatch = referrer.match(/\/(student|teacher|admin)/);
            if (dashboardMatch) {
                setBackUrl(dashboardMatch[0]);
                setBackLabel("Back to Dashboard");
            }
        }
    }, []);

    return (
        <Button variant="ghost" asChild className="text-slate-400 hover:text-white">
            <Link href={backUrl} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
            </Link>
        </Button>
    );
}

const subjects = [
    "All Subjects",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Computer Science",
    "English",
    "Spanish",
    "French",
    "History",
    "Music",
];

const languages = ["All Languages", "English", "Spanish", "French", "German", "Mandarin", "Japanese"];

export default function BrowsePage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("All Subjects");
    const [selectedLanguage, setSelectedLanguage] = useState("All Languages");
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
    const [showFilters, setShowFilters] = useState(false);
    const [tutors, setTutors] = useState<TeacherData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadTeachers() {
            try {
                const filters: Record<string, string | number> = {};
                if (selectedSubject !== "All Subjects") {
                    filters.subject = selectedSubject;
                }
                if (selectedLanguage !== "All Languages") {
                    filters.language = selectedLanguage;
                }
                const teachers = await browseTeachers(filters);
                setTutors(teachers as TeacherData[]);
            } catch (err) {
                console.error("Error loading teachers:", err);
            } finally {
                setLoading(false);
            }
        }

        loadTeachers();
    }, [selectedSubject, selectedLanguage]);

    const filteredTutors = tutors.filter((tutor) => {
        const matchesSearch =
            searchQuery === "" ||
            tutor.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tutor.subjects?.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesPrice =
            tutor.hourly_rate >= priceRange[0] && tutor.hourly_rate <= priceRange[1];

        return matchesSearch && matchesPrice;
    });

    return (
        <main className="bg-slate-50 dark:bg-slate-950 min-h-screen">
            <FloatingThemeToggle />

            <div className="pt-28 pb-16 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-12 relative">
                        <div className="absolute left-0 top-0 hidden md:block">
                            <BackButton />
                        </div>
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-4">
                            Find Your Perfect <span className="gradient-text">Tutor</span>
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Browse our network of expert tutors and find the perfect match for your learning goals.
                        </p>
                    </div>

                    {/* Search and filters */}
                    <div className="bg-white dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-8">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                <Input
                                    placeholder="Search by name, subject, or keyword..."
                                    className="pl-12 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-violet-500"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Subject dropdown */}
                            <div className="relative">
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="h-11 px-4 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-200 text-sm appearance-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                                >
                                    {subjects.map((subject) => (
                                        <option key={subject} value={subject} className="bg-white dark:bg-slate-950">
                                            {subject}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                            </div>

                            {/* Language dropdown */}
                            <div className="relative">
                                <select
                                    value={selectedLanguage}
                                    onChange={(e) => setSelectedLanguage(e.target.value)}
                                    className="h-11 px-4 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-200 text-sm appearance-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                                >
                                    {languages.map((lang) => (
                                        <option key={lang} value={lang} className="bg-white dark:bg-slate-950">
                                            {lang}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                            </div>

                            {/* More filters button */}
                            <Button
                                variant="outline"
                                onClick={() => setShowFilters(!showFilters)}
                                className={`border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white ${showFilters ? "border-violet-500 text-violet-600 dark:text-violet-400" : ""}`}
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                More Filters
                            </Button>
                        </div>

                        {/* Expanded filters */}
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 pt-4 border-t border-slate-800"
                            >
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-slate-500" />
                                        <span className="text-sm text-slate-500 dark:text-slate-400">Price range:</span>
                                        <input
                                            type="range"
                                            min="0"
                                            max="200"
                                            value={priceRange[1]}
                                            onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                                            className="w-32 accent-violet-500"
                                        />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                            $0 - ${priceRange[1]}/hr
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Active filters */}
                        {(selectedSubject !== "All Subjects" ||
                            selectedLanguage !== "All Languages" ||
                            searchQuery) && (
                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    <span className="text-sm text-slate-500">Active filters:</span>
                                    {searchQuery && (
                                        <Badge variant="outline" className="gap-1 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                                            &ldquo;{searchQuery}&rdquo;
                                            <button onClick={() => setSearchQuery("")} className="hover:text-slate-900 dark:hover:text-white">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    )}
                                    {selectedSubject !== "All Subjects" && (
                                        <Badge variant="outline" className="gap-1 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                                            {selectedSubject}
                                            <button onClick={() => setSelectedSubject("All Subjects")} className="hover:text-slate-900 dark:hover:text-white">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    )}
                                    {selectedLanguage !== "All Languages" && (
                                        <Badge variant="outline" className="gap-1 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                                            {selectedLanguage}
                                            <button onClick={() => setSelectedLanguage("All Languages")} className="hover:text-slate-900 dark:hover:text-white">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    )}
                                    <button
                                        onClick={() => {
                                            setSearchQuery("");
                                            setSelectedSubject("All Subjects");
                                            setSelectedLanguage("All Languages");
                                            setPriceRange([0, 200]);
                                        }}
                                        className="text-sm text-violet-400 hover:text-violet-300"
                                    >
                                        Clear all
                                    </button>
                                </div>
                            )}
                    </div>

                    {/* Loading state */}
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                        </div>
                    ) : (
                        <>
                            {/* Results count */}
                            <p className="text-slate-500 dark:text-slate-400 mb-6">
                                Showing <span className="font-semibold text-slate-900 dark:text-slate-200">{filteredTutors.length}</span> tutors
                            </p>

                            {/* Tutors grid */}
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredTutors.map((tutor, index) => (
                                    <motion.div
                                        key={tutor.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                    >
                                        <Card
                                            hover
                                            className="h-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-violet-500/30 cursor-pointer transition-all"
                                            onClick={() => router.push(`/teachers/${tutor.user_id}`)}
                                        >
                                            <CardContent className="p-6">
                                                <div className="flex items-start gap-4 mb-4">
                                                    <Avatar
                                                        fallback={tutor.user?.full_name || "Tutor"}
                                                        src={tutor.user?.avatar_url}
                                                        size="xl"
                                                        className="border-2 border-slate-200 dark:border-slate-800"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-slate-900 dark:text-slate-50 truncate">
                                                            {tutor.user?.full_name || "Tutor"}
                                                        </h3>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {tutor.subjects.slice(0, 2).map((subject) => (
                                                                <Badge key={subject} variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
                                                                    {subject}
                                                                </Badge>
                                                            ))}
                                                            {tutor.subjects.length > 2 && (
                                                                <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">+{tutor.subjects.length - 2}</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">{tutor.bio}</p>

                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-1">
                                                        <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                                                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                                                            {tutor.average_rating?.toFixed(1) || "N/A"}
                                                        </span>
                                                        <span className="text-slate-500">({tutor.total_reviews || 0})</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-sm text-slate-500">
                                                        <Clock className="h-4 w-4" />
                                                        {tutor.total_lessons || 0} lessons
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mb-4 text-sm text-slate-500">
                                                    <div className="flex items-center gap-1">
                                                        <Globe className="h-4 w-4" />
                                                        {tutor.languages?.slice(0, 2).join(", ") || "English"}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                                                    <div>
                                                        <span className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                                                            ${tutor.hourly_rate}
                                                        </span>
                                                        <span className="text-slate-500">/hour</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Link href={`/student/messages?message=${tutor.user_id}`} onClick={(e) => e.stopPropagation()}>
                                                            <Button size="sm" variant="outline" className="border-violet-200 text-violet-600 hover:bg-violet-50">
                                                                <MessageSquare className="h-4 w-4 mr-1" />
                                                                Message
                                                            </Button>
                                                        </Link>
                                                        <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">View Profile</Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>

                            {/* No results */}
                            {filteredTutors.length === 0 && (
                                <div className="text-center py-12">
                                    <Search className="h-12 w-12 text-slate-400 dark:text-slate-700 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200 mb-2">No tutors found</h3>
                                    <p className="text-slate-600 dark:text-slate-500">
                                        Try adjusting your filters or search query.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <Footer />
        </main>
    );
}

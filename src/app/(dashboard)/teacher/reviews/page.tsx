"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, MessageSquare, ThumbsUp, Filter, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Avatar, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { getReviewsForTeacher } from "@/lib/db";

interface Review {
    id: string;
    rating: number;
    content?: string;
    created_at: string;
    lesson?: {
        subject: string;
    };
    student?: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
}

interface ReviewStats {
    average: number;
    total: number;
    breakdown: { stars: number; count: number }[];
}

export default function TeacherReviews() {
    const [user, setUser] = useState<{ id: string; full_name: string; email: string; avatar_url?: string } | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats>({
        average: 0,
        total: 0,
        breakdown: [
            { stars: 5, count: 0 },
            { stars: 4, count: 0 },
            { stars: 3, count: 0 },
            { stars: 2, count: 0 },
            { stars: 1, count: 0 },
        ],
    });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        async function fetchData() {
            const supabase = createClient();
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (authUser) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('id, full_name, email, avatar_url')
                    .eq('id', authUser.id)
                    .single();

                if (userData) {
                    setUser(userData);

                    // Fetch reviews
                    try {
                        const teacherReviews = await getReviewsForTeacher(userData.id);
                        setReviews(teacherReviews as Review[]);

                        // Calculate stats
                        if (teacherReviews.length > 0) {
                            const total = teacherReviews.length;
                            const sum = teacherReviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0);
                            const avg = sum / total;

                            const breakdown = [5, 4, 3, 2, 1].map(stars => ({
                                stars,
                                count: teacherReviews.filter((r: any) => r.rating === stars).length
                            }));

                            setStats({
                                average: avg,
                                total,
                                breakdown
                            });
                        }
                    } catch (err) {
                        console.error("Error fetching reviews:", err);
                    }
                }
            }

            setLoading(false);
        }

        fetchData();
    }, []);

    const userName = user?.full_name || "Teacher";
    const userEmail = user?.email;
    const userAvatar = user?.avatar_url;

    const filteredReviews = reviews.filter(r =>
        searchQuery === "" ||
        r.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.student?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-violet-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reviews</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">See what your students are saying about you</p>
                </div>
            </div>

            {/* Rating Overview */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                    <CardContent className="p-6">
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Average Rating */}
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <p className="text-5xl font-bold text-slate-900 dark:text-white">
                                        {stats.total > 0 ? stats.average.toFixed(1) : "N/A"}
                                    </p>
                                    <div className="flex gap-0.5 justify-center my-2">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`h-5 w-5 ${i < Math.floor(stats.average) ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-600"}`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{stats.total} reviews</p>
                                </div>
                                <div className="flex-1 space-y-2">
                                    {stats.breakdown.map((item) => (
                                        <div key={item.stars} className="flex items-center gap-2">
                                            <span className="text-sm text-slate-600 dark:text-slate-400 w-3">{item.stars}</span>
                                            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                                            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-amber-400 rounded-full"
                                                    style={{ width: stats.total > 0 ? `${(item.count / stats.total) * 100}%` : '0%' }}
                                                />
                                            </div>
                                            <span className="text-sm text-slate-600 dark:text-slate-400 w-8 text-right">{item.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-800">
                                    <MessageSquare className="h-5 w-5 text-emerald-400 mb-2" />
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {stats.total > 0 ? `${Math.round((reviews.filter(r => r.content).length / stats.total) * 100)}%` : '0%'}
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">With Comments</p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-800">
                                    <ThumbsUp className="h-5 w-5 text-emerald-400 mb-2" />
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {stats.total > 0 ? `${Math.round((stats.breakdown.find(b => b.stars >= 4)?.count || 0) / stats.total * 100)}%` : '0%'}
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Positive Rating</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <Input
                    placeholder="Search reviews..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white"
                />
                <Button variant="outline" className="border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-300">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                </Button>
            </div>

            {/* Reviews List */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="space-y-4"
            >
                {filteredReviews.length > 0 ? (
                    filteredReviews.map((review, index) => (
                        <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                            <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <Avatar fallback={review.student?.full_name || "Student"} src={review.student?.avatar_url} size="lg" className="border-slate-300 dark:border-slate-700" />
                                        <div className="flex-1">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-white">{review.student?.full_name || "Student"}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="flex gap-0.5">
                                                            {[...Array(review.rating)].map((_, i) => (
                                                                <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
                                                            ))}
                                                        </div>
                                                        {review.lesson?.subject && (
                                                            <>
                                                                <span className="text-sm text-slate-400">•</span>
                                                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-transparent dark:bg-slate-800 dark:text-slate-300">
                                                                    {review.lesson.subject}
                                                                </Badge>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                                    {new Date(review.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {review.content && (
                                                <p className="text-slate-700 dark:text-slate-300 mt-3">{review.content}</p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                        <Star className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-600 dark:text-slate-400">No reviews yet</p>
                        <p className="text-sm text-slate-500 mt-1">Reviews will appear here after students rate their lessons</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

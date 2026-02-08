"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Loader2 } from "lucide-react";
import { Button, Input, Textarea, Label } from "@/components/ui";

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    lessonId: string;
    teacherId: string;
    teacherName: string;
    subject: string;
    onSuccess: () => void;
}

export function ReviewModal({
    isOpen,
    onClose,
    lessonId,
    teacherId,
    teacherName,
    subject,
    onSuccess,
}: ReviewModalProps) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            setError("Please select a rating");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    teacher_id: teacherId,
                    lesson_id: lessonId,
                    rating,
                    content,
                    subject,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to submit review");
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error("Review submission error:", err);
            setError(err instanceof Error ? err.message : "Failed to submit review");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Rate your lesson</h2>
                                <button
                                    onClick={onClose}
                                    className="text-slate-400 hover:text-slate-500 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                <div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                        How was your <strong>{subject}</strong> lesson with <strong>{teacherName}</strong>?
                                    </p>

                                    <div className="flex justify-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                className="focus:outline-none transition-transform hover:scale-110"
                                            >
                                                <Star
                                                    className={`h-8 w-8 transition-colors ${star <= (hoverRating || rating)
                                                            ? "text-amber-400 fill-amber-400"
                                                            : "text-slate-300 dark:text-slate-700"
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-center text-sm font-medium text-slate-600 dark:text-slate-400 mt-2">
                                        {hoverRating > 0 ? (
                                            <>
                                                {hoverRating === 1 && "Poor"}
                                                {hoverRating === 2 && "Fair"}
                                                {hoverRating === 3 && "Good"}
                                                {hoverRating === 4 && "Very Good"}
                                                {hoverRating === 5 && "Excellent"}
                                            </>
                                        ) : rating > 0 ? (
                                            <>
                                                {rating === 1 && "Poor"}
                                                {rating === 2 && "Fair"}
                                                {rating === 3 && "Good"}
                                                {rating === 4 && "Very Good"}
                                                {rating === 5 && "Excellent"}
                                            </>
                                        ) : (
                                            "Select a rating"
                                        )}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="content">Your review (optional)</Label>
                                    <Textarea
                                        id="content"
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="Share your experience..."
                                        className="h-32 resize-none"
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                                        {error}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="flex-1" disabled={loading || rating === 0}>
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            "Submit Review"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

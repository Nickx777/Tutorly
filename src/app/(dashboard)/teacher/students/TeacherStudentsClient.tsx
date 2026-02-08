"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Users,
    Search,
    Mail,
    BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Avatar, Input } from "@/components/ui";

interface Student {
    id: string;
    full_name: string;
    email?: string;
    avatar_url?: string;
    totalLessons: number;
    lastLesson?: string;
}

interface UserData {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
}

interface TeacherStudentsClientProps {
    user: UserData;
    students: Student[];
}

export default function TeacherStudentsClient({ user, students }: TeacherStudentsClientProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const userName = user?.full_name || "Teacher";
    const userEmail = user?.email;
    const userAvatar = user?.avatar_url;

    const filteredStudents = students.filter(s =>
        s.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Students</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your student relationships.</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
            </div>

            {/* Students Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                            <Users className="h-5 w-5 text-violet-500" />
                            All Students ({filteredStudents.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredStudents.length > 0 ? (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredStudents.map((student) => (
                                    <div
                                        key={student.id}
                                        className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-violet-500 dark:hover:border-violet-500 transition-colors"
                                    >
                                        <div className="flex items-start gap-4">
                                            <Avatar
                                                fallback={student.full_name}
                                                src={student.avatar_url}
                                                size="lg"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-slate-900 dark:text-white truncate">
                                                    {student.full_name}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <BookOpen className="h-4 w-4 text-slate-400" />
                                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                                        {student.totalLessons} lesson{student.totalLessons !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex gap-2">
                                            <Button variant="outline" size="sm" className="flex-1 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                                <Mail className="h-4 w-4 mr-1" />
                                                Message
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Users className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-600 dark:text-slate-400">
                                    {searchQuery ? "No students found" : "No students yet"}
                                </p>
                                <p className="text-sm text-slate-500 mt-1">
                                    Students will appear here after they book lessons with you.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

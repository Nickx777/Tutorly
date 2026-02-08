"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    FileText,
    Download,
    Calendar,
    Loader2,
    Users,
    BookOpen,
    DollarSign,
    Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui";
import { DashboardLayout } from "@/components/dashboard";
import { createClient } from "@/lib/supabase/client";

interface Report {
    id: string;
    name: string;
    type: "users" | "lessons" | "revenue" | "general";
    lastGenerated: string;
    description: string;
}

const availableReports: Report[] = [
    { id: "1", name: "User Activity Report", type: "users", lastGenerated: "2026-02-05", description: "Detailed breakdown of user signups, logins, and engagement" },
    { id: "2", name: "Lesson Summary Report", type: "lessons", lastGenerated: "2026-02-04", description: "Overview of completed, cancelled, and pending lessons" },
    { id: "3", name: "Revenue Report", type: "revenue", lastGenerated: "2026-02-03", description: "Financial summary including earnings and payouts" },
    { id: "4", name: "Teacher Performance", type: "general", lastGenerated: "2026-02-02", description: "Ratings, reviews, and lesson completion rates" },
    { id: "5", name: "Platform Health Report", type: "general", lastGenerated: "2026-02-01", description: "System uptime, errors, and performance metrics" },
];

export default function AdminReports() {
    const [user, setUser] = useState<{ full_name: string; email: string; avatar_url?: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const supabase = createClient();
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (authUser) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('full_name, email, avatar_url')
                    .eq('id', authUser.id)
                    .single();

                if (userData) {
                    setUser(userData);
                }
            }

            setLoading(false);
        }

        fetchData();
    }, []);

    const userName = user?.full_name || "Admin";
    const userEmail = user?.email;
    const userAvatar = user?.avatar_url;

    const getReportIcon = (type: Report["type"]) => {
        switch (type) {
            case "users": return Users;
            case "lessons": return BookOpen;
            case "revenue": return DollarSign;
            default: return FileText;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-violet-500" />
            </div>
        );
    }

    const handleDownload = async (report: Report) => {
        try {
            const { getAllUsers, getAllLessons } = await import("@/lib/db");
            const supabase = createClient();
            let data: any[] = [];
            let filename = `${report.type}_report_${new Date().toISOString().split('T')[0]}.csv`;

            if (report.type === "users") {
                const users = await getAllUsers();
                data = users || [];
            } else if (report.type === "lessons") {
                const lessons = await getAllLessons();
                data = lessons || [];
            } else if (report.type === "revenue") {
                const { data: payments } = await supabase
                    .from("payments")
                    .select("*");
                data = payments || [];
            } else {
                alert("Custom report generation coming soon.");
                return;
            }

            if (data.length === 0) {
                alert("No data available for this report.");
                return;
            }

            // Convert to CSV
            const headers = Object.keys(data[0]);
            const csvContent = [
                headers.join(","),
                ...data.map(row => headers.map(header => {
                    const value = row[header];
                    return typeof value === 'object' ? JSON.stringify(value).replace(/,/g, ';') : value;
                }).join(","))
            ].join("\n");

            // Download
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (err) {
            console.error("Error generating report:", err);
            alert("Failed to generate report.");
        }
    };

    return (
        <DashboardLayout userRole="admin" userName={userName} userEmail={userEmail} userAvatar={userAvatar}>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports</h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">Generate and download platform reports.</p>
                    </div>
                </div>

                {/* Reports Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableReports.map((report) => {
                            const Icon = getReportIcon(report.type);
                            return (
                                <Card key={report.id} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-violet-500 dark:hover:border-violet-500 transition-colors">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                                                <Icon className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                                            </div>
                                            <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                {report.type}
                                            </Badge>
                                        </div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{report.name}</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{report.description}</p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                                <Calendar className="h-3 w-3" />
                                                Data: Current
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                                                onClick={() => handleDownload(report)}
                                            >
                                                <Download className="h-4 w-4 mr-1" />
                                                CSV
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        </DashboardLayout>
    );
}

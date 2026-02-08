"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    DollarSign,
    Search,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    CreditCard,
    Users,
    Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Avatar, Input } from "@/components/ui";
import { DashboardLayout } from "@/components/dashboard";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

interface Transaction {
    id: string;
    description: string;
    amount: number;
    type: "credit" | "debit";
    status: "completed" | "pending" | "failed";
    date: string;
    user?: {
        name: string;
        avatar?: string;
    };
}

// Demo transaction data
const demoTransactions: Transaction[] = [
    { id: "1", description: "Lesson payment - Advanced Math", amount: 45.00, type: "credit", status: "completed", date: "2026-02-06", user: { name: "Sarah Johnson" } },
    { id: "2", description: "Teacher payout - Dr. Wilson", amount: 120.00, type: "debit", status: "completed", date: "2026-02-05", user: { name: "Dr. Wilson" } },
    { id: "3", description: "Lesson payment - Physics", amount: 60.00, type: "credit", status: "completed", date: "2026-02-04", user: { name: "Michael Chen" } },
    { id: "4", description: "Refund - Cancelled lesson", amount: 45.00, type: "debit", status: "completed", date: "2026-02-03", user: { name: "Emma Wilson" } },
    { id: "5", description: "Lesson payment - Chemistry", amount: 55.00, type: "credit", status: "pending", date: "2026-02-02", user: { name: "James Brown" } },
];

export default function AdminTransactions() {
    const [user, setUser] = useState<{ full_name: string; email: string; avatar_url?: string } | null>(null);
    const [transactions] = useState<Transaction[]>(demoTransactions);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

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

    const filteredTransactions = transactions.filter(t =>
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.user?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate totals
    const totalCredits = transactions.filter(t => t.type === "credit" && t.status === "completed").reduce((sum, t) => sum + t.amount, 0);
    const totalDebits = transactions.filter(t => t.type === "debit" && t.status === "completed").reduce((sum, t) => sum + t.amount, 0);
    const pendingAmount = transactions.filter(t => t.status === "pending").reduce((sum, t) => sum + t.amount, 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-violet-500" />
            </div>
        );
    }

    return (
        <DashboardLayout userRole="admin" userName={userName} userEmail={userEmail} userAvatar={userAvatar}>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Transactions</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">View and manage platform transactions.</p>
                </div>

                {/* Summary Cards */}
                <div className="grid sm:grid-cols-3 gap-6">
                    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Credits</p>
                                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalCredits)}</p>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                                    <ArrowUpRight className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Debits</p>
                                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalDebits)}</p>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
                                    <ArrowDownRight className="h-5 w-5 text-red-600 dark:text-red-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Pending</p>
                                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(pendingAmount)}</p>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center">
                                    <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Search transactions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        />
                    </div>
                    <Button variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                </div>

                {/* Transactions Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-slate-900 dark:text-white">All Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {filteredTransactions.map((tx) => (
                                    <div
                                        key={tx.id}
                                        className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === "credit"
                                                    ? "bg-emerald-100 dark:bg-emerald-500/10"
                                                    : "bg-red-100 dark:bg-red-500/10"
                                                }`}>
                                                {tx.type === "credit" ? (
                                                    <ArrowUpRight className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                                ) : (
                                                    <ArrowDownRight className="h-5 w-5 text-red-600 dark:text-red-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">{tx.description}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-sm text-slate-500">{tx.user?.name}</span>
                                                    <span className="text-slate-300 dark:text-slate-600">•</span>
                                                    <span className="text-sm text-slate-500">{tx.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold ${tx.type === "credit"
                                                    ? "text-emerald-600 dark:text-emerald-400"
                                                    : "text-red-600 dark:text-red-400"
                                                }`}>
                                                {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                                            </p>
                                            <Badge className={
                                                tx.status === "completed"
                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                                    : tx.status === "pending"
                                                        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                                                        : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                                            }>
                                                {tx.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </DashboardLayout>
    );
}

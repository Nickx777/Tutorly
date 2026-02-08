"use client";

import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Calendar, Download, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";

interface EarningsStats {
    totalEarnings: number;
    totalEarningsChange: string;
    thisMonthEarnings: number;
    thisMonthChange: string;
    pendingEarnings: number;
    pendingChange: string;
    averagePerLesson: number;
    averageChange: string;
}

interface Transaction {
    id: string;
    student: string;
    subject: string;
    amount: number;
    date: string;
    status: "completed" | "pending" | "processing" | "failed";
}

interface MonthlyData {
    month: string;
    earnings: number;
}

interface EarningsClientProps {
    stats: EarningsStats;
    transactions: Transaction[];
    monthlyData: MonthlyData[];
}

export default function EarningsClient({ stats, transactions, monthlyData }: EarningsClientProps) {
    const statsList = [
        { title: "Total Earnings", value: stats.totalEarnings, change: stats.totalEarningsChange },
        { title: "This Month", value: stats.thisMonthEarnings, change: stats.thisMonthChange },
        { title: "Pending", value: stats.pendingEarnings, change: stats.pendingChange },
        { title: "Average per Lesson", value: stats.averagePerLesson, change: stats.averageChange },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Earnings</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">Track your income and payment history</p>
                </div>
                <Button variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsList.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.title}</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                                            {formatCurrency(stat.value)}
                                        </p>
                                        <span className="text-xs text-slate-500 dark:text-slate-500">{stat.change}</span>
                                    </div>
                                    <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                                        {stat.title === "Pending" ? (
                                            <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                        ) : (
                                            <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Monthly Overview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                    className="lg:col-span-2"
                >
                    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 h-full">
                        <CardHeader>
                            <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Monthly Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end justify-between h-48 gap-2">
                                {monthlyData.map((data) => {
                                    const maxEarnings = Math.max(...monthlyData.map(d => d.earnings), 100); // Prevent divide by zero
                                    const height = (data.earnings / maxEarnings) * 100;
                                    return (
                                        <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                                            <div
                                                className="w-full bg-emerald-200 hover:bg-emerald-300 dark:bg-emerald-500/20 dark:hover:bg-emerald-500 rounded-t-lg relative group cursor-pointer transition-colors"
                                                style={{ height: `${height === 0 ? 5 : height}%` }} // Min height for visibility
                                            >
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                    {formatCurrency(data.earnings)}
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-600 dark:text-slate-500">{data.month}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Payout Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                >
                    <Card className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-0">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                    <Wallet className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-white/80 text-sm">Next Payout</p>
                                    <p className="text-2xl font-bold">{formatCurrency(stats.pendingEarnings)}</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-white/70">Status</span>
                                    <span>{stats.pendingEarnings > 0 ? "Processing" : "No pending funds"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/70">Expected</span>
                                    <span>--</span>
                                </div>
                            </div>
                            <Button className="w-full mt-4 bg-white text-emerald-600 hover:bg-white/90" disabled={stats.pendingEarnings <= 0}>
                                Withdraw
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Recent Transactions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.6 }}
            >
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-slate-900 dark:text-white">Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {transactions.length === 0 ? (
                            <p className="text-center text-slate-500 py-8">No recent transactions found.</p>
                        ) : (
                            <div className="space-y-4">
                                {transactions.map((tx) => (
                                    <div
                                        key={tx.id}
                                        className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                                                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">{tx.subject}</p>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">with {tx.student}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-slate-900 dark:text-white">{formatCurrency(tx.amount)}</p>
                                            <div className="flex items-center gap-2 justify-end">
                                                <span className="text-xs text-slate-500 dark:text-slate-500">{tx.date}</span>
                                                <Badge
                                                    variant="secondary"
                                                    className={tx.status === "completed"
                                                        ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                                        : "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                                                    }
                                                >
                                                    {tx.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

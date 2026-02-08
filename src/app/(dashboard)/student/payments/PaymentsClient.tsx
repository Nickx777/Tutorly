"use client";

import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";
import { DollarSign, CreditCard, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { PageTransition } from "@/components/ui/PageTransition";

interface Transaction {
    id: string;
    amount: number;
    type: string;
    status: string;
    created_at: string;
    lesson?: {
        subject: string;
        teacher?: {
            full_name: string;
        };
    };
}

interface PaymentsClientProps {
    transactions: Transaction[];
    balance: number;
}

export default function PaymentsClient({ transactions, balance }: PaymentsClientProps) {
    return (
        <PageTransition className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Payments & Billing</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">View your payment history and transactions.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Wallet Card */}
                <Card className="md:col-span-1 bg-gradient-to-br from-violet-600 to-indigo-700 border-none">
                    <CardContent className="p-6 text-white">
                        <div className="flex items-center gap-2 mb-2">
                            <Wallet className="h-5 w-5 text-violet-200" />
                            <p className="text-violet-200 text-sm font-medium">Total Spent</p>
                        </div>
                        <h2 className="text-4xl font-bold mt-2">{formatCurrency(balance)}</h2>
                        <p className="text-violet-200 text-sm mt-2">All time</p>
                    </CardContent>
                </Card>

                {/* Payment Methods Info */}
                <Card className="md:col-span-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-slate-900 dark:text-slate-50 flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-violet-500" />
                            Payment Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                                Payments are processed securely through the platform when booking lessons.
                                Your payment details are handled by our secure payment provider.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transaction History */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-slate-50">Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                    {transactions.length > 0 ? (
                        <div className="space-y-4">
                            {transactions.map((tx) => (
                                <motion.div
                                    key={tx.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors border-b border-slate-200 dark:border-slate-800 last:border-0"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-full ${tx.type === 'refund' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                            <DollarSign className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-slate-50">
                                                {tx.lesson?.subject
                                                    ? `Lesson: ${tx.lesson.subject}`
                                                    : tx.type === 'refund' ? 'Refund' : 'Payment'
                                                }
                                            </p>
                                            <p className="text-xs text-slate-500">{formatDateTime(tx.created_at)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${tx.type === 'refund' ? 'text-emerald-500' : 'text-slate-900 dark:text-slate-50'}`}>
                                            {tx.type === 'refund' ? '+' : '-'}{formatCurrency(tx.amount)}
                                        </p>
                                        <Badge className={
                                            tx.status === 'completed'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                : tx.status === 'pending'
                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400'
                                        }>
                                            {tx.status}
                                        </Badge>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <DollarSign className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-600 dark:text-slate-400">No transactions yet</p>
                            <p className="text-sm text-slate-500 mt-1">Transactions will appear here after you book lessons</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </PageTransition>
    );
}

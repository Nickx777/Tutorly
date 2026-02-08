"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Users,
    Search,
    Filter,
    MoreVertical,
    Ban,
    CheckCircle,
    Mail,
    Loader2,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Button,
    Badge,
    Avatar,
    Input,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    Label,
    Textarea
} from "@/components/ui";
import { DashboardLayout } from "@/components/dashboard";
import { createClient } from "@/lib/supabase/client";
import { getAllUsers, updateUserStatus, approveTeacher } from "@/lib/db";

interface UserItem {
    id: string;
    full_name: string;
    email: string;
    role: string;
    avatar_url?: string;
    suspended: boolean;
    suspended_reason?: string;
    created_at: string;
    teacher_profile?: {
        id: string;
        approved: boolean;
        subjects: string[];
        hourly_rate: number;
    }[];
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [adminUser, setAdminUser] = useState<{ id: string; full_name: string; avatar_url?: string } | null>(null);

    // Suspension Dialog State
    const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
    const [userToSuspend, setUserToSuspend] = useState<UserItem | null>(null);
    const [suspensionReason, setSuspensionReason] = useState("");

    useEffect(() => {
        async function fetchData() {
            const supabase = createClient();
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (authUser) {
                const { data: userData } = await supabase
                    .from("users")
                    .select("id, full_name, avatar_url")
                    .eq("id", authUser.id)
                    .single();
                if (userData) setAdminUser(userData);
            }

            try {
                const usersData = await getAllUsers();
                setUsers(usersData as UserItem[]);
            } catch (err) {
                console.error("Error fetching users:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    const handleSuspendClick = (user: UserItem) => {
        if (user.suspended) {
            // If already suspended, just unsuspend directly (or could ask for confirmation too)
            handleUnsuspend(user.id);
        } else {
            // Open dialog for suspension
            setUserToSuspend(user);
            setSuspensionReason("");
            setIsSuspendDialogOpen(true);
        }
    };

    const confirmSuspension = async () => {
        if (!userToSuspend) return;

        setActionLoading(userToSuspend.id);
        try {
            await updateUserStatus(userToSuspend.id, {
                suspended: true,
                suspended_reason: suspensionReason
            });

            setUsers(prev =>
                prev.map(u => (u.id === userToSuspend.id ? {
                    ...u,
                    suspended: true,
                    suspended_reason: suspensionReason
                } : u))
            );
            setIsSuspendDialogOpen(false);
        } catch (err) {
            console.error("Error suspending user:", err);
        } finally {
            setActionLoading(null);
            setUserToSuspend(null);
        }
    };

    const handleUnsuspend = async (userId: string) => {
        setActionLoading(userId);
        try {
            await updateUserStatus(userId, { suspended: false });
            setUsers(prev =>
                prev.map(u => (u.id === userId ? { ...u, suspended: false, suspended_reason: undefined } : u))
            );
        } catch (err) {
            console.error("Error unsuspending user:", err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleApproveTeacher = async (userId: string) => {
        setActionLoading(userId);
        try {
            await approveTeacher(userId);
            setUsers(prev =>
                prev.map(u => {
                    if (u.id === userId && u.teacher_profile) {
                        return {
                            ...u,
                            teacher_profile: u.teacher_profile.map(tp => ({ ...tp, approved: true }))
                        };
                    }
                    return u;
                })
            );
            toast.success("Teacher approved successfully!");
        } catch (err: any) {
            console.error("Error approving teacher:", err);
            toast.error("Failed to approve teacher: " + (err.message || "Unknown error"));
        } finally {
            setActionLoading(null);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = !roleFilter || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const userName = adminUser?.full_name || "Admin";
    const userAvatar = adminUser?.avatar_url;

    if (loading) {
        return (
            <DashboardLayout userRole="admin" userName={userName} userAvatar={userAvatar}>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout userRole="admin" userName={userName} userAvatar={userAvatar}>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Manage all users, teachers, and students
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-white dark:bg-slate-800"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={roleFilter === null ? "default" : "outline"}
                            size="sm"
                            onClick={() => setRoleFilter(null)}
                        >
                            All
                        </Button>
                        <Button
                            variant={roleFilter === "teacher" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setRoleFilter("teacher")}
                        >
                            Teachers
                        </Button>
                        <Button
                            variant={roleFilter === "student" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setRoleFilter("student")}
                        >
                            Students
                        </Button>
                        <Button
                            variant={roleFilter === "admin" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setRoleFilter("admin")}
                        >
                            Admins
                        </Button>
                    </div>
                </div>

                {/* Users Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-white/5">
                                            <th className="text-left p-4 text-sm font-medium text-slate-700 dark:text-slate-300">User</th>
                                            <th className="text-left p-4 text-sm font-medium text-slate-700 dark:text-slate-300">Role</th>
                                            <th className="text-left p-4 text-sm font-medium text-slate-700 dark:text-slate-300">Status</th>
                                            <th className="text-left p-4 text-sm font-medium text-slate-700 dark:text-slate-300">Joined</th>
                                            <th className="text-right p-4 text-sm font-medium text-slate-700 dark:text-slate-300">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((user) => {
                                            const teacherProfile = user.teacher_profile?.[0];
                                            const isApproved = teacherProfile?.approved;
                                            const isPendingTeacher = user.role === "teacher" && teacherProfile && !isApproved;

                                            return (
                                                <tr
                                                    key={user.id}
                                                    className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5"
                                                >
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar
                                                                fallback={user.full_name || user.email}
                                                                src={user.avatar_url}
                                                                size="sm"
                                                            />
                                                            <div>
                                                                <p className="font-medium text-slate-900 dark:text-white">
                                                                    {user.full_name || "Unnamed"}
                                                                </p>
                                                                <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <Badge
                                                            variant={
                                                                user.role === "admin"
                                                                    ? "destructive"
                                                                    : user.role === "teacher"
                                                                        ? "default"
                                                                        : "secondary"
                                                            }
                                                            className={
                                                                user.role === "admin"
                                                                    ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300"
                                                                    : user.role === "teacher"
                                                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                                                                        : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                                                            }
                                                        >
                                                            {user.role}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4">
                                                        {user.suspended ? (
                                                            <div className="flex flex-col gap-1">
                                                                <Badge variant="destructive" className="bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300 w-fit">
                                                                    Suspended
                                                                </Badge>
                                                                {user.suspended_reason && (
                                                                    <span className="text-xs text-red-500 max-w-[150px] truncate" title={user.suspended_reason}>
                                                                        {user.suspended_reason}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : isPendingTeacher ? (
                                                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                                                                Pending Approval
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                                                                Active
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                                                        {new Date(user.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex justify-end gap-2">
                                                            {isPendingTeacher && (
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                                                                    onClick={() => handleApproveTeacher(user.id)}
                                                                    disabled={actionLoading === user.id}
                                                                >
                                                                    {actionLoading === user.id ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <>
                                                                            <CheckCircle className="h-4 w-4 mr-1" />
                                                                            Approve
                                                                        </>
                                                                    )}
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className={
                                                                    user.suspended
                                                                        ? "border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                                                                        : "border-red-300 text-red-600 hover:bg-red-50"
                                                                }
                                                                onClick={() => handleSuspendClick(user)}
                                                                disabled={actionLoading === user.id || user.id === adminUser?.id}
                                                            >
                                                                {actionLoading === user.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : user.id === adminUser?.id ? (
                                                                    <span className="text-slate-500 cursor-not-allowed">This is you</span>
                                                                ) : user.suspended ? (
                                                                    <>
                                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                                        Unsuspend
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Ban className="h-4 w-4 mr-1" />
                                                                        Suspend
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {filteredUsers.length === 0 && (
                                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>No users found</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Suspension Dialog */}
                <Dialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-red-600">
                                <AlertTriangle className="h-5 w-5" />
                                Suspend User
                            </DialogTitle>
                            <DialogDescription>
                                Are you sure you want to suspend <strong>{userToSuspend?.full_name}</strong>?
                                This will restrict their access and cancel any upcoming lessons (if they are a teacher).
                            </DialogDescription>
                        </DialogHeader>

                        <div className="my-4">
                            <Label htmlFor="reason" className="mb-2 block">Reason for suspension (Required)</Label>
                            <Textarea
                                id="reason"
                                placeholder="Violation of terms of service..."
                                value={suspensionReason}
                                onChange={(e) => setSuspensionReason(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsSuspendDialogOpen(false)}>Cancel</Button>
                            <Button
                                variant="destructive"
                                onClick={confirmSuspension}
                                disabled={!suspensionReason.trim() || !!actionLoading}
                            >
                                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Suspend User
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}

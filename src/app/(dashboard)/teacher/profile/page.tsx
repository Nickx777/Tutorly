"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, MapPin, Link as LinkIcon, Mail, GraduationCap, Award, Edit2, Save, Globe, Loader2, X, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Avatar, Input, Textarea } from "@/components/ui";
import { ImageCropModal } from "@/components/dashboard";
import { createClient } from "@/lib/supabase/client";
import { getTeacherByUserId, updateTeacherProfile, createTeacherProfile, getTeacherStats, getTeacherPackages, updateTeacherPackages } from "@/lib/db";
import { TeacherPackage } from "@/types/database";

interface TeacherProfileData {
    bio: string;
    title: string;
    location: string;
    website: string;
    subjects: string[];
    languages: string[];
    hourly_rate: number;
    group_rate: number | null;
    timezone: string;
    packages?: TeacherPackage[];
}

interface TeacherFormData extends TeacherProfileData {
    full_name: string;
    email: string;
}

interface Stats {
    total_students: number;
    total_lessons: number;
    average_rating: number;
}

const timezones = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Australia/Sydney",
];

// Add detected timezone if not in the list
const detectedTimezone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
if (detectedTimezone && !timezones.includes(detectedTimezone)) {
    timezones.push(detectedTimezone);
}

const availableSubjects = [
    "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
    "English", "Spanish", "French", "German", "History", "Geography",
    "Music", "Art", "Economics", "Psychology", "Calculus", "Algebra",
    "Statistics", "Programming", "Data Science"
];

const availableLanguages = [
    "English", "Spanish", "French", "German", "Mandarin", "Japanese",
    "Korean", "Portuguese", "Italian", "Russian", "Arabic", "Hindi"
];

export default function TeacherProfile() {
    const [user, setUser] = useState<{ id: string; email: string; user_metadata: { full_name?: string; avatar_url?: string } } | null>(null);
    const [profile, setProfile] = useState<TeacherProfileData | null>(null);
    const [formData, setFormData] = useState<TeacherFormData>({
        full_name: "",
        email: "",
        bio: "",
        title: "",
        location: "",
        website: "",
        subjects: [],
        languages: [],
        hourly_rate: 0,
        group_rate: null,
        timezone: "UTC",
        packages: [],
    });
    const [stats, setStats] = useState<Stats>({ total_students: 0, total_lessons: 0, average_rating: 0 });
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newSubject, setNewSubject] = useState("");
    const [newLanguage, setNewLanguage] = useState("");
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const supabase = createClient();

    useEffect(() => {
        async function loadProfile() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setError("Not authenticated");
                    setLoading(false);
                    return;
                }
                setUser({
                    id: user.id,
                    email: user.email || "",
                    user_metadata: user.user_metadata as { full_name?: string; avatar_url?: string }
                });

                // Load teacher profile
                const teacherProfile = await getTeacherByUserId(user.id);

                if (teacherProfile) {
                    setProfile(teacherProfile);
                    setFormData({
                        full_name: user.user_metadata?.full_name || "",
                        email: user.email || "",
                        bio: teacherProfile.bio || "",
                        title: teacherProfile.title || "",
                        location: teacherProfile.location || "",
                        website: teacherProfile.website || "",
                        subjects: teacherProfile.subjects || [],
                        languages: teacherProfile.languages || [],
                        hourly_rate: teacherProfile.hourly_rate || 0,
                        group_rate: teacherProfile.group_rate || null,
                        timezone: teacherProfile.timezone || "UTC",
                        packages: teacherProfile.packages || [],
                    });

                    // Load stats
                    const teacherStats = await getTeacherStats(user.id);
                    setStats({
                        total_students: teacherStats.total_students,
                        total_lessons: teacherStats.total_lessons,
                        average_rating: teacherStats.average_rating,
                    });
                } else {
                    // No profile yet, use defaults
                    setFormData(prev => ({
                        ...prev,
                        full_name: user.user_metadata?.full_name || "",
                        email: user.email || "",
                    }));
                }
            } catch (err) {
                console.error("Error loading profile:", err);
                setError("Failed to load profile");
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
    }, [supabase]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        // Reset file input so same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = "";

        const reader = new FileReader();
        reader.onload = () => {
            setSelectedImage(reader.result as string);
            setCropModalOpen(true);
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = async (croppedImageBlob: Blob) => {
        if (!user) return;

        setCropModalOpen(false);
        setUploading(true);
        setError(null);

        try {
            const fileName = `avatar-${Date.now()}.jpg`;
            const file = new File([croppedImageBlob], fileName, { type: 'image/jpeg' });

            const { uploadAvatar } = await import("@/lib/db");
            const publicUrl = await uploadAvatar(user.id, file);

            // Update user state
            setUser(prev => prev ? {
                ...prev,
                user_metadata: { ...prev.user_metadata, avatar_url: publicUrl }
            } : null);

            // Update Supabase auth metadata to persist across sessions
            await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

        } catch (err: any) {
            console.error("Error uploading avatar:", err);
            setError("Failed to upload image. Please try again.");
        } finally {
            setUploading(false);
            setSelectedImage(null);
        }
    };

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        setError(null);

        try {
            const profileData = {
                bio: formData.bio,
                title: formData.title,
                location: formData.location,
                website: formData.website,
                subjects: formData.subjects,
                languages: formData.languages,
                hourly_rate: formData.hourly_rate,
                group_rate: formData.group_rate,
                timezone: formData.timezone,
            };

            const packageData = formData.packages || [];

            // Strict Validation
            if (!formData.full_name || !formData.bio || formData.subjects.length === 0 || formData.languages.length === 0 || !formData.timezone) {
                setError("Please complete all required fields (Name, Bio, Subjects, Languages, Timezone)");
                setSaving(false);
                return;
            }

            if (profile) {
                await updateTeacherProfile(user.id, profileData);
                await updateTeacherPackages((profile as any).id, packageData);
            } else {
                const newProfile = await createTeacherProfile(user.id, profileData);
                if (newProfile) {
                    await updateTeacherPackages(newProfile.id, packageData);
                }
            }

            // Update user name if changed
            if (formData.full_name !== user.user_metadata?.full_name) {
                await supabase.auth.updateUser({
                    data: { full_name: formData.full_name }
                });
            }

            setProfile({ ...profile, ...profileData } as TeacherProfileData);
            setIsEditing(false);
        } catch (err) {
            console.error("Error saving profile:", err);
            setError("Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    const addSubject = (subject: string) => {
        if (subject && !formData.subjects.includes(subject)) {
            setFormData(prev => ({
                ...prev,
                subjects: [...prev.subjects, subject]
            }));
        }
        setNewSubject("");
    };

    const removeSubject = (subject: string) => {
        setFormData(prev => ({
            ...prev,
            subjects: prev.subjects.filter(s => s !== subject)
        }));
    };

    const addLanguage = (language: string) => {
        if (language && !formData.languages.includes(language)) {
            setFormData(prev => ({
                ...prev,
                languages: [...prev.languages, language]
            }));
        }
        setNewLanguage("");
    };

    const removeLanguage = (language: string) => {
        setFormData(prev => ({
            ...prev,
            languages: prev.languages.filter(l => l !== language)
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    const userName = formData.full_name || user?.user_metadata?.full_name || "Teacher";
    const userAvatar = user?.user_metadata?.avatar_url;

    return (
        <>
            <ImageCropModal
                isOpen={cropModalOpen}
                onClose={() => setCropModalOpen(false)}
                image={selectedImage}
                onCropComplete={handleCropComplete}
            />
            <div className="space-y-8">
                {/* Hidden File Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarUpload}
                    accept="image/*"
                    className="hidden"
                />

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-100 border border-red-200 rounded-xl p-4 text-center dark:bg-red-600/20 dark:border-red-500/30">
                        <p className="text-red-700 text-sm dark:text-red-300">{error}</p>
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
                        <p className="text-slate-600 mt-1 dark:text-slate-400">Manage your public profile and information</p>
                    </div>
                    <Button
                        className={isEditing ? "bg-emerald-600 hover:bg-emerald-700" : "bg-white text-black hover:bg-zinc-200"}
                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                        disabled={saving}
                    >
                        {saving ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                        ) : isEditing ? (
                            <><Save className="h-4 w-4 mr-2" /> Save Changes</>
                        ) : (
                            <><Edit2 className="h-4 w-4 mr-2" /> Edit Profile</>
                        )}
                    </Button>
                </div>

                {/* Profile Header Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Card className="bg-white border-slate-200 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
                        <div className="h-32 bg-gradient-to-r from-emerald-600 to-teal-600" />
                        <CardContent className="p-6 -mt-16">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <Avatar
                                        fallback={formData.full_name}
                                        src={userAvatar}
                                        size="xl"
                                        className={`w-32 h-32 ring-4 ring-white dark:ring-slate-900 transition-opacity ${uploading ? 'opacity-50' : 'group-hover:opacity-90'}`}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        {uploading ? (
                                            <Loader2 className="h-8 w-8 animate-spin text-white" />
                                        ) : (
                                            <Camera className="h-8 w-8 text-white" />
                                        )}
                                    </div>
                                    {isEditing && (
                                        <div className="absolute bottom-0 right-0 p-2 bg-emerald-600 rounded-full text-white shadow-lg pointer-events-none">
                                            <Camera className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 pt-4 md:pt-16">
                                    {isEditing ? (
                                        <div className="space-y-4">
                                            <Input
                                                value={formData.full_name}
                                                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                                                placeholder="Your name"
                                                className="bg-white border-slate-300 text-slate-900 text-xl font-bold dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                            />
                                            <Input
                                                value={formData.title}
                                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                                placeholder="Your title (e.g., Mathematics & Physics Expert)"
                                                className="bg-white border-slate-300 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{formData.full_name}</h2>
                                            <p className="text-slate-600 dark:text-slate-400">{formData.title || "No title set"}</p>
                                        </>
                                    )}
                                    <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-600 dark:text-slate-400">
                                        {isEditing ? (
                                            <>
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="h-4 w-4" />
                                                    <Input
                                                        value={formData.location}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                                        placeholder="Location"
                                                        className="h-8 w-40 bg-white border-slate-300 text-sm dark:bg-slate-800 dark:border-slate-700"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <LinkIcon className="h-4 w-4" />
                                                    <Input
                                                        value={formData.website}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                                                        placeholder="Website"
                                                        className="h-8 w-40 bg-white border-slate-300 text-sm dark:bg-slate-800 dark:border-slate-700"
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                {formData.location && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-4 w-4" />
                                                        {formData.location}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Mail className="h-4 w-4" />
                                                    {formData.email}
                                                </span>
                                                {formData.website && (
                                                    <span className="flex items-center gap-1">
                                                        <LinkIcon className="h-4 w-4" />
                                                        {formData.website}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4 md:pt-16">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total_students}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Students</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total_lessons}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Lessons</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.average_rating || "N/A"}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Rating</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* About & Pricing */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="lg:col-span-2 space-y-8"
                    >
                        <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-900 dark:text-white">About</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isEditing ? (
                                    <Textarea
                                        value={formData.bio}
                                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                        placeholder="Tell students about yourself, your teaching experience, and what makes you a great tutor..."
                                        className="bg-white border-slate-300 text-slate-900 min-h-[150px] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    />
                                ) : (
                                    <p className="text-slate-700 leading-relaxed dark:text-slate-300">
                                        {formData.bio || "No bio added yet. Edit your profile to add one!"}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Pricing Card */}
                        <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-slate-900 dark:text-white">Pricing & Packages</CardTitle>
                                {isEditing && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setFormData(prev => ({
                                            ...prev,
                                            packages: [...(prev.packages || []), {
                                                id: Math.random().toString(),
                                                teacher_id: user?.id || "",
                                                name: "New Package",
                                                lesson_count: 5,
                                                price: 100,
                                                created_at: new Date().toISOString(),
                                                updated_at: new Date().toISOString()
                                            }]
                                        }))}
                                        className="h-8"
                                    >
                                        <Plus className="h-4 w-4 mr-1" /> Add Package
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                                            Base Hourly Rate ($)
                                        </label>
                                        {isEditing ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                                                        Base Hourly Rate (€)
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        value={formData.hourly_rate}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: Number(e.target.value) }))}
                                                        className="w-full bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-700"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                                                        Group Session Rate (€)
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        value={formData.group_rate || ""}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, group_rate: e.target.value ? Number(e.target.value) : null }))}
                                                        placeholder="Optional (e.g. 40)"
                                                        className={`w-full bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-700 ${formData.group_rate && formData.group_rate > formData.hourly_rate ? 'border-red-500' : ''}`}
                                                    />
                                                    {formData.group_rate && formData.group_rate > formData.hourly_rate && (
                                                        <p className="text-[10px] text-red-500 mt-1">Group rate cannot exceed base rate</p>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap gap-8">
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Base Rate</p>
                                                    <p className="text-3xl font-bold text-slate-900 dark:text-white">€{formData.hourly_rate}<span className="text-sm font-normal text-slate-500 ml-1">/ hr</span></p>
                                                </div>
                                                {formData.group_rate && (
                                                    <div>
                                                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Group Rate</p>
                                                        <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">€{formData.group_rate}<span className="text-sm font-normal text-slate-500 ml-1">/ hr</span></p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Lesson Packages</h4>
                                        <div className="grid gap-4">
                                            {formData.packages && formData.packages.length > 0 ? (
                                                formData.packages.map((pkg, index) => (
                                                    <div key={pkg.id || index} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                                        {isEditing ? (
                                                            <div className="space-y-3">
                                                                <div className="flex justify-between items-start gap-4">
                                                                    <Input
                                                                        placeholder="Package Name (e.g. Starter Pack)"
                                                                        value={pkg.name}
                                                                        onChange={(e) => {
                                                                            const newPkgs = [...(formData.packages || [])];
                                                                            newPkgs[index].name = e.target.value;
                                                                            setFormData(prev => ({ ...prev, packages: newPkgs }));
                                                                        }}
                                                                        className="h-8 font-semibold bg-white border-slate-300"
                                                                    />
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        onClick={() => {
                                                                            const newPkgs = (formData.packages || []).filter((_, i) => i !== index);
                                                                            setFormData(prev => ({ ...prev, packages: newPkgs }));
                                                                        }}
                                                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Lessons</label>
                                                                        <Input
                                                                            type="number"
                                                                            value={pkg.lesson_count}
                                                                            onChange={(e) => {
                                                                                const newPkgs = [...(formData.packages || [])];
                                                                                newPkgs[index].lesson_count = Number(e.target.value);
                                                                                setFormData(prev => ({ ...prev, packages: newPkgs }));
                                                                            }}
                                                                            className="h-8 bg-white border-slate-300"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Total Price (€)</label>
                                                                        <Input
                                                                            type="number"
                                                                            value={pkg.price}
                                                                            onChange={(e) => {
                                                                                const newPkgs = [...(formData.packages || [])];
                                                                                newPkgs[index].price = Number(e.target.value);
                                                                                setFormData(prev => ({ ...prev, packages: newPkgs }));
                                                                            }}
                                                                            className="h-8 bg-white border-slate-300"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <Input
                                                                    placeholder="Short description (optional)"
                                                                    value={pkg.description || ""}
                                                                    onChange={(e) => {
                                                                        const newPkgs = [...(formData.packages || [])];
                                                                        newPkgs[index].description = e.target.value;
                                                                        setFormData(prev => ({ ...prev, packages: newPkgs }));
                                                                    }}
                                                                    className="h-8 text-sm bg-white border-slate-300"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="flex justify-between items-center">
                                                                <div>
                                                                    <h5 className="font-bold text-slate-900 dark:text-white">{pkg.name}</h5>
                                                                    <p className="text-sm text-slate-500">{pkg.lesson_count} lessons • {pkg.description || "No description"}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-lg font-bold text-emerald-600">€{pkg.price}</p>
                                                                    <p className="text-[10px] text-slate-400 font-medium">€{(pkg.price / pkg.lesson_count).toFixed(2)} / lesson</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                                    <p className="text-slate-500 text-sm">No custom packages yet.</p>
                                                    {isEditing && (
                                                        <p className="text-xs text-slate-400 mt-1">Add packages to offer discounts to your students.</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Timezone */}
                        <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-900 flex items-center gap-2 dark:text-white">
                                    <Globe className="h-5 w-5" />
                                    Timezone
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div className="flex gap-4">
                                            <select
                                                value={formData.timezone}
                                                onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                                                className="flex-1 p-2 rounded-lg bg-white border border-slate-300 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                            >
                                                {!timezones.includes(formData.timezone) && (
                                                    <option key={formData.timezone} value={formData.timezone}>{formData.timezone}</option>
                                                )}
                                                {timezones.map(tz => (
                                                    <option key={tz} value={tz}>{tz}</option>
                                                ))}
                                            </select>
                                            <Button
                                                variant="outline"
                                                onClick={() => setFormData(prev => ({ ...prev, timezone: detectedTimezone }))}
                                                className="border-slate-200 dark:border-slate-700"
                                            >
                                                Auto-detect
                                            </Button>
                                        </div>
                                        {formData.timezone !== detectedTimezone && formData.timezone === "UTC" && (
                                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 dark:bg-amber-900/20 dark:border-amber-500/30">
                                                <p className="text-sm text-amber-800 dark:text-amber-300">
                                                    We detected your timezone as <strong>{detectedTimezone}</strong>. Would you like to use it?
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-slate-700 dark:text-slate-300">
                                        {formData.timezone}
                                        {formData.timezone === "UTC" && detectedTimezone !== "UTC" && (
                                            <span className="ml-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                                                (Recommendation: {detectedTimezone})
                                            </span>
                                        )}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Sidebar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className="space-y-8"
                    >
                        {/* Subjects */}
                        <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-900 dark:text-white">Subjects</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {formData.subjects.map((subject) => (
                                        <Badge
                                            key={subject}
                                            variant="secondary"
                                            className="bg-emerald-100 text-emerald-700 border-emerald-200 px-3 py-1 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
                                        >
                                            {subject}
                                            {isEditing && (
                                                <button onClick={() => removeSubject(subject)} className="ml-2">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            )}
                                        </Badge>
                                    ))}
                                </div>
                                {isEditing && (
                                    <div className="mt-4">
                                        <select
                                            value={newSubject}
                                            onChange={(e) => {
                                                if (e.target.value) addSubject(e.target.value);
                                            }}
                                            className="w-full p-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                        >
                                            <option value="">Add a subject...</option>
                                            {availableSubjects.filter(s => !formData.subjects.includes(s)).map(subject => (
                                                <option key={subject} value={subject}>{subject}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {formData.subjects.length === 0 && !isEditing && (
                                    <p className="text-slate-500 text-sm">No subjects added yet</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Languages */}
                        <Card className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-900 dark:text-white">Languages</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {formData.languages.map((language) => (
                                        <Badge
                                            key={language}
                                            variant="secondary"
                                            className="bg-violet-100 text-violet-700 border-violet-200 px-3 py-1 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20"
                                        >
                                            {language}
                                            {isEditing && (
                                                <button onClick={() => removeLanguage(language)} className="ml-2">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            )}
                                        </Badge>
                                    ))}
                                </div>
                                {isEditing && (
                                    <div className="mt-4">
                                        <select
                                            value={newLanguage}
                                            onChange={(e) => {
                                                if (e.target.value) addLanguage(e.target.value);
                                            }}
                                            className="w-full p-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                        >
                                            <option value="">Add a language...</option>
                                            {availableLanguages.filter(l => !formData.languages.includes(l)).map(language => (
                                                <option key={language} value={language}>{language}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {formData.languages.length === 0 && !isEditing && (
                                    <p className="text-slate-500 text-sm">No languages added yet</p>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </>
    );
}

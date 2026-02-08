"use client";

import { useState } from "react";
import { Card, CardContent, Switch, Button, Badge } from "@/components/ui";
import { Clock, Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { TeacherProfile } from "@/types/database";

interface BufferSettingsProps {
    initialBufferMinutes: number;
    initialIsBufferEnabled: boolean;
}

export default function BufferSettings({ initialBufferMinutes, initialIsBufferEnabled }: BufferSettingsProps) {
    const [bufferMinutes, setBufferMinutes] = useState(initialBufferMinutes);
    const [isEnabled, setIsEnabled] = useState(initialIsBufferEnabled);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch("/api/availability/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    buffer_minutes: bufferMinutes,
                    is_buffer_enabled: isEnabled
                }),
            });

            if (!response.ok) throw new Error("Failed to save settings");

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error("Error saving buffer settings:", error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6">
                <div className="flex flex-col gap-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white">Buffer Time</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Automatically add breaks between your lessons.</p>
                            </div>
                        </div>
                        <Switch
                            checked={isEnabled}
                            onCheckedChange={(checked) => {
                                setIsEnabled(checked);
                                // Auto-save on toggle? Or wait for save button? 
                                // Let's keep it explicit with a save button for now as per design generally
                            }}
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <input
                            type="number"
                            value={bufferMinutes}
                            onChange={(e) => setBufferMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                            disabled={!isEnabled}
                            className="w-20 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50"
                        />
                        <span className="text-slate-700 dark:text-slate-300">minutes between lessons</span>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        {success && (
                            <motion.span
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
                            >
                                <Check className="h-4 w-4" /> Saved
                            </motion.span>
                        )}
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

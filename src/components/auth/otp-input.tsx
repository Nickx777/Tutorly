"use client";

import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OTPInputProps {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    onComplete?: (value: string) => void;
    disabled?: boolean;
    className?: string;
}

export function OTPInput({
    length = 6,
    value,
    onChange,
    onComplete,
    disabled = false,
    className,
}: OTPInputProps) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    // Initialize refs array
    useEffect(() => {
        inputRefs.current = inputRefs.current.slice(0, length);
    }, [length]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const char = e.target.value.slice(-1);
        if (!char || /^\d$/.test(char)) {
            const newValue = value.split("");
            newValue[index] = char;
            const updatedValue = newValue.join("");
            onChange(updatedValue);

            // Move to next input if char was added
            if (char && index < length - 1) {
                inputRefs.current[index + 1]?.focus();
            }

            // Call onComplete if all fields are filled
            if (updatedValue.length === length && onComplete) {
                onComplete(updatedValue);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace" && !value[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").slice(0, length);
        if (/^\d+$/.test(pastedData)) {
            onChange(pastedData);
            inputRefs.current[Math.min(pastedData.length, length - 1)]?.focus();
            if (pastedData.length === length && onComplete) {
                onComplete(pastedData);
            }
        }
    };

    return (
        <div className={cn("flex gap-1.5 sm:gap-2 justify-center", className)}>
            {Array.from({ length }).map((_, i) => (
                <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={value[i] || ""}
                    disabled={disabled}
                    onChange={(e) => handleChange(e, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    onPaste={handlePaste}
                    onFocus={() => setFocusedIndex(i)}
                    onBlur={() => setFocusedIndex(null)}
                    className={cn(
                        "w-8 h-10 sm:w-10 sm:h-12 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-lg text-center text-lg font-bold text-slate-900 dark:text-white transition-all outline-none focus:outline-none",
                        focusedIndex === i && "border-violet-500 bg-violet-50 dark:bg-violet-500/10 ring-2 ring-violet-500/20",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                />
            ))}
        </div>
    );
}

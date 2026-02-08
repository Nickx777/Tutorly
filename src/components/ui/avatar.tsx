import * as React from "react";
import { cn, getInitials } from "@/lib/utils";
import Image from "next/image";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    src?: string | null;
    alt?: string;
    fallback?: string;
    size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
};

export function Avatar({
    src,
    alt = "Avatar",
    fallback,
    size = "md",
    className,
    ...props
}: AvatarProps) {
    const [imageError, setImageError] = React.useState(false);

    const showFallback = !src || imageError;
    const initials = fallback ? getInitials(fallback) : "?";

    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-semibold text-white ring-2 ring-white dark:ring-slate-900",
                sizeClasses[size],
                className
            )}
            {...props}
        >
            {showFallback ? (
                <span className="bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 w-full h-full flex items-center justify-center">{initials}</span>
            ) : (
                <Image
                    src={src}
                    alt={alt}
                    fill
                    sizes="(max-width: 768px) 64px, 128px"
                    className="object-cover"
                    onError={() => setImageError(true)}
                />
            )}
        </div>
    );
}

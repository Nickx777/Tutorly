"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: "dark" | "light";
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: "system",
    resolvedTheme: "dark",
    setTheme: () => {},
    toggleTheme: () => {},
});

function getSystemTheme(): "dark" | "light" {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialTheme(): Theme {
    if (typeof window === "undefined") return "system";
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved) return saved;
    return "system";
}

function applyTheme(theme: Theme) {
    const root = document.documentElement;
    const resolved = theme === "system" ? getSystemTheme() : theme;

    if (resolved === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
        root.style.colorScheme = "dark";
    } else {
        root.classList.add("light");
        root.classList.remove("dark");
        root.style.colorScheme = "light";
    }

    return resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("system");
    const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const initialTheme = getInitialTheme();
        setThemeState(initialTheme);
        const resolved = applyTheme(initialTheme);
        setResolvedTheme(resolved);
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const resolved = applyTheme(theme);
        setResolvedTheme(resolved);
        localStorage.setItem("theme", theme);
    }, [theme, mounted]);

    useEffect(() => {
        if (!mounted || theme !== "system") return;
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => {
            const resolved = applyTheme("system");
            setResolvedTheme(resolved);
        };
        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [theme, mounted]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    const toggleTheme = () => {
        setThemeState((prev) => {
            const currentResolved = prev === "system" ? getSystemTheme() : prev;
            return currentResolved === "dark" ? "light" : "dark";
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}

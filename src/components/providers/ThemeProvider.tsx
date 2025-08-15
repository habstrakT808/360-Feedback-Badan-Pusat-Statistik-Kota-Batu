// src/components/providers/ThemeProvider.tsx
"use client";
import { createContext, useContext, useEffect } from "react";

interface ThemeContextType {
  theme: "light";
  setTheme: (theme: "light") => void;
  resolvedTheme: "light";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme: "light" = "light";
  const resolvedTheme: "light" = "light";

  useEffect(() => {
    // Always apply light theme
    const root = document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");
  }, []);

  const setTheme = (newTheme: "light") => {
    // Theme is always light, no need to change
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

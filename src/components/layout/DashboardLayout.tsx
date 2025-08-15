// src/components/layout/DashboardLayout.tsx
"use client";
import { useEffect, useState, ReactNode } from "react";
import { Navigation } from "./Navigation";
import { useUser } from "@/store/useStore";
import { Loading } from "@/components/ui/Loading";
import { motion } from "framer-motion";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const user = useUser();

  useEffect(() => {
    // Give some time for AuthProvider to initialize
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Show loading while initializing
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Loading size="lg" text="Memuat..." />
      </div>
    );
  }

  // Don't redirect automatically - let AdminGuard handle admin access
  // Only redirect if user is completely null (not logged in)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Loading size="lg" text="Memverifikasi autentikasi..." />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex overflow-hidden">
      <Navigation />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-1 h-screen overflow-y-auto"
      >
        {children}
      </motion.main>
    </div>
  );
}

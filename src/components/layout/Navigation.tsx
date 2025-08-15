// src/components/layout/Navigation.tsx (UPDATE)
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, spring } from "framer-motion";
import {
  Home,
  BarChart3,
  Users,
  Award,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  Bell,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { useUser, useSetUser } from "@/store/useStore";
import { toast } from "react-hot-toast";
import { usePathname } from "next/navigation";
import { useUserRole } from "@/hooks/useUserRole";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Beri Penilaian", href: "/assessment", icon: BarChart3 },
  { name: "Hasil Saya", href: "/my-results", icon: Award },
  { name: "Tim", href: "/team", icon: Users },
  { name: "Notifikasi", href: "/notifications", icon: Bell },
  { name: "Pengaturan", href: "/settings", icon: Settings },
];

// Admin-only navigation items
const adminNavigation = [{ name: "Admin", href: "/admin", icon: Shield }];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const user = useUser();
  const setUser = useSetUser();
  const { isAdmin } = useUserRole();
  const pathname = usePathname();

  // Custom scrollbar styles
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(148, 163, 184, 0.3);
        border-radius: 3px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(148, 163, 184, 0.5);
      }
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: rgba(148, 163, 184, 0.3) transparent;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Gagal logout");
    } else {
      setUser(null);
      toast.success("Berhasil logout");
      window.location.href = "/";
    }
  };

  // Check if current path is active
  const isActive = (href: string) => {
    return pathname === href;
  };

  // Combine navigation based on user role
  const allNavigation = isAdmin
    ? [...navigation, ...adminNavigation]
    : navigation;

  return (
    <>
      {/* Mobile menu button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </motion.button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div
        className={`fixed lg:static left-0 top-0 z-40 w-72 h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-screen">
          {/* Header */}
          <div className="p-6 flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <img src="/logo-bps.png" alt="BPS Logo" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold">BPS Kota Batu</h1>
                <p className="text-slate-400 text-sm">360° Feedback</p>
              </div>
            </motion.div>
          </div>

          {/* User Info */}
          <div className="px-6 pb-6 flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-3"
            >
              {/* User Name and Email */}
              <div className="text-center">
                <p className="text-sm font-medium text-white truncate">
                  {user?.user_metadata?.full_name || user?.email}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                {/* Role Badge */}
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      isAdmin
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {isAdmin ? "Admin" : "User"}
                  </span>
                </div>
              </div>

              {/* Notification Bell - REMOVED */}
            </motion.div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 pb-6 space-y-2 overflow-y-auto custom-scrollbar">
            {allNavigation.map((item, index) => {
              const isCurrentActive = isActive(item.href);

              return (
                <motion.a
                  key={item.name}
                  href={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{
                    x: 8,
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isCurrentActive
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-slate-300 hover:text-white"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon
                    className={`w-5 h-5 transition-colors ${
                      isCurrentActive
                        ? "text-white"
                        : "group-hover:text-blue-400"
                    }`}
                  />
                  <span className="font-medium">{item.name}</span>

                  {/* Active indicator */}
                  {isCurrentActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto w-2 h-2 bg-white rounded-full"
                    />
                  )}
                </motion.a>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="px-6 pb-6 flex-shrink-0">
            <motion.button
              whileHover={{
                scale: 1.02,
                backgroundColor: "rgba(239, 68, 68, 0.1)",
              }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-slate-300 hover:text-red-400 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Keluar</span>
            </motion.button>
          </div>
        </div>
      </div>
    </>
  );
}

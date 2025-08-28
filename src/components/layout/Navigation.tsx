// src/components/layout/Navigation.tsx (REPLACE COMPLETE FILE)
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, spring } from "framer-motion";
import Image from "next/image";
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
  Pin,
  ChevronDown,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUser, useSetUser } from "@/store/useStore";
import { toast } from "react-hot-toast";
import { usePathname } from "next/navigation";
import { useUserRole } from "@/hooks/useUserRole";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  {
    name: "Beri Penilaian",
    icon: BarChart3,
    children: [
      { name: "Penilaian 360", href: "/assessment", icon: BarChart3 },
      { name: "EOTM", href: "/pins", icon: Pin },
      { name: "Triwulan", href: "/triwulan", icon: Award },
    ],
  },
  { name: "Hasil Saya", href: "/my-results", icon: Award },
  { name: "Tim", href: "/team", icon: Users },
];

// Admin-only navigation items
const adminNavigation = [{ name: "Admin", href: "/admin", icon: Shield }];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const user = useUser();
  const setUser = useSetUser();
  const { isAdmin, isSupervisor } = useUserRole();
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);

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

  // Load current user's profile for avatar preview
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", user.id)
        .single();
      if (data) setProfile(data);
    };
    loadProfile();
  }, [user?.id]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut({ scope: "local" });
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

  // Open the Beri Penilaian section when on its children routes
  useEffect(() => {
    const isAssessment = pathname?.startsWith("/assessment");
    const isPins = pathname?.startsWith("/pins");
    const isTriwulan = pathname?.startsWith("/triwulan");
    if (isAssessment || isPins || isTriwulan) {
      setOpenMenu("Beri Penilaian");
    }
  }, [pathname]);

  // Combine navigation based on user role
  const allNavigation = isAdmin ? adminNavigation : navigation;

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
                <Image
                  src="/logo-bps-optimized.svg"
                  alt="BPS Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
                />
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
              {/* User Avatar */}
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-white/20 bg-white/10 flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || user?.email || "Avatar"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/80 text-xl font-semibold">
                      {(profile?.full_name || user?.email || "?")
                        .slice(0, 1)
                        .toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* User Name and Email */}
              <div className="text-center">
                <p className="text-sm font-medium text-white truncate">
                  {profile?.full_name ||
                    user?.user_metadata?.full_name ||
                    user?.email}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                {/* Role Badge + Settings */}
                <div className="mt-2 flex items-center justify-center gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      isAdmin
                        ? "bg-red-100 text-red-800"
                        : isSupervisor
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {isAdmin ? "Admin" : isSupervisor ? "Supervisor" : "User"}
                  </span>
                  <a
                    href="/settings"
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition"
                    aria-label="Pengaturan"
                    title="Pengaturan"
                  >
                    <Settings className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 pb-6 space-y-2 overflow-y-auto custom-scrollbar">
            {allNavigation.map((item, index) => {
              const hasChildren = Array.isArray((item as any).children);
              if (hasChildren) {
                const children = (item as any).children as Array<{
                  name: string;
                  href: string;
                  icon: any;
                }>;
                const isSectionActive = children.some((c) => isActive(c.href));
                const isExpanded = openMenu === item.name;
                return (
                  <div key={item.name} className="space-y-2">
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      whileHover={{
                        x: 8,
                        backgroundColor: "rgba(59, 130, 246, 0.1)",
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        setOpenMenu((prev) =>
                          prev === item.name ? null : (item.name as string)
                        )
                      }
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left group ${
                        isSectionActive || isExpanded
                          ? "bg-blue-600 text-white shadow-lg"
                          : "text-slate-300 hover:text-white"
                      }`}
                    >
                      <item.icon
                        className={`w-5 h-5 transition-colors ${
                          isSectionActive || isExpanded
                            ? "text-white"
                            : "group-hover:text-blue-400"
                        }`}
                      />
                      <span className="font-medium flex-1">{item.name}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          isExpanded ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    </motion.button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="pl-6 space-y-2"
                        >
                          {children.map((child, cIndex) => {
                            const isChildActive = isActive(child.href);
                            return (
                              <motion.a
                                key={child.name}
                                href={child.href}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.05 * cIndex }}
                                whileHover={{ x: 8 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 ml-2 ${
                                  isChildActive
                                    ? "bg-blue-600 text-white shadow"
                                    : "text-slate-300 hover:text-white hover:bg-white/5"
                                }`}
                                onClick={() => setIsOpen(false)}
                              >
                                <child.icon className="w-4 h-4" />
                                <span className="text-sm">{child.name}</span>
                              </motion.a>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              const isCurrentActive = isActive((item as any).href);
              return (
                <motion.a
                  key={item.name}
                  href={(item as any).href}
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
                  <span className="font-medium">{(item as any).name}</span>

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

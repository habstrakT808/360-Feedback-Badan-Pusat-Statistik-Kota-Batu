// src/app/settings/page.tsx
"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { PrivacySettings } from "@/components/settings/PrivacySettings";

import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { useStore } from "@/store/useStore";
import { SettingsService } from "@/lib/settings-service";
import { Loading } from "@/components/ui/Loading";
import {
  User,
  Shield,
  Eye,
  Bell,
  Settings as SettingsIcon,
} from "lucide-react";
import { toast } from "react-hot-toast";

const settingsTabs = [
  {
    id: "profile",
    name: "Profil",
    icon: User,
    description: "Kelola informasi profil Anda",
  },
  {
    id: "security",
    name: "Keamanan",
    icon: Shield,
    description: "Password dan keamanan akun",
  },
  {
    id: "privacy",
    name: "Privasi",
    icon: Eye,
    description: "Kontrol visibilitas data Anda",
  },

  {
    id: "notifications",
    name: "Notifikasi",
    icon: Bell,
    description: "Atur preferensi notifikasi",
  },
];

export default function SettingsPage() {
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const profileData = await SettingsService.getUserProfile(user.id);
      setProfile(profileData);
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Gagal memuat profil");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = (updatedProfile: any) => {
    setProfile(updatedProfile);
    toast.success("Profil berhasil diperbarui");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loading size="lg" text="Memuat pengaturan..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold gradient-text">
                Pengaturan
              </h1>
              <p className="text-gray-600">
                Kelola profil dan preferensi akun Anda
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Kategori</h2>
              <nav className="space-y-2">
                {settingsTabs.map((tab) => (
                  <motion.button
                    key={tab.id}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 group ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                        : "hover:bg-gray-50 text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <tab.icon
                        className={`w-5 h-5 ${
                          activeTab === tab.id
                            ? "text-white"
                            : "text-gray-400 group-hover:text-blue-500"
                        }`}
                      />
                      <div>
                        <p className="font-medium">{tab.name}</p>
                        <p
                          className={`text-xs ${
                            activeTab === tab.id
                              ? "text-blue-100"
                              : "text-gray-400"
                          }`}
                        >
                          {tab.description}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </nav>
            </div>
          </motion.div>

          {/* Settings Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              {activeTab === "profile" && (
                <ProfileSettings
                  profile={profile}
                  onUpdate={handleProfileUpdate}
                />
              )}
              {activeTab === "security" && <SecuritySettings />}
              {activeTab === "privacy" && (
                <PrivacySettings
                  profile={profile}
                  onUpdate={handleProfileUpdate}
                />
              )}

              {activeTab === "notifications" && (
                <NotificationSettings
                  profile={profile}
                  onUpdate={handleProfileUpdate}
                />
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// src/components/settings/NotificationSettings.tsx
"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useStore } from "../../store/useStore";
import { Bell, Mail, Smartphone, Clock, Info, CheckCircle } from "lucide-react";
import { toast } from "react-hot-toast";

interface NotificationSettingsProps {
  profile: any;
  onUpdate: (profile: any) => void;
}

export function NotificationSettings({
  profile,
  onUpdate,
}: NotificationSettingsProps) {
  const { user } = useStore();
  const [loading, setLoading] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    reminder_frequency: "daily" as "daily" | "hourly" | "weekly" | "monthly",
    quiet_hours_start: "22:00",
    quiet_hours_end: "08:00",
    priority_levels: ["urgent", "high"],
    notification_types: ["reminder", "deadline", "completion", "system"],
  });

  useEffect(() => {
    // Load default settings since we don't have a database table for this yet
    // In a real application, these would be stored in the profiles table or a separate preferences table
  }, []);

  const handleSettingChange = (key: string, value: any) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // For now, just show success message since we don't have the database table
      // In a real application, this would save to the database
      toast.success("Pengaturan notifikasi berhasil disimpan");
    } catch (error: any) {
      toast.error("Gagal menyimpan pengaturan notifikasi");
    } finally {
      setLoading(false);
    }
  };

  const toggleNotificationType = (type: string) => {
    const currentTypes = notificationSettings.notification_types;
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t: string) => t !== type)
      : [...currentTypes, type];

    handleSettingChange("notification_types", newTypes);
  };

  const togglePriorityLevel = (level: string) => {
    const currentLevels = notificationSettings.priority_levels;
    const newLevels = currentLevels.includes(level)
      ? currentLevels.filter((l: string) => l !== level)
      : [...currentLevels, level];

    handleSettingChange("priority_levels", newLevels);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center space-x-3 mb-6">
        <Bell className="w-6 h-6 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notifikasi</h2>
          <p className="text-gray-600">
            Kelola preferensi notifikasi dan pengingat
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Notification Channels */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Saluran Notifikasi
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-gray-900">
                    Email Notifikasi
                  </h4>
                  <p className="text-sm text-gray-600">
                    Terima notifikasi via email
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  handleSettingChange(
                    "email_notifications",
                    !notificationSettings.email_notifications
                  )
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationSettings.email_notifications
                    ? "bg-blue-600"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationSettings.email_notifications
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <Smartphone className="w-5 h-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Push Notifikasi</h4>
                  <p className="text-sm text-gray-600">
                    Terima notifikasi di browser
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  handleSettingChange(
                    "push_notifications",
                    !notificationSettings.push_notifications
                  )
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationSettings.push_notifications
                    ? "bg-blue-600"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationSettings.push_notifications
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Notification Types */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Jenis Notifikasi
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                key: "reminder",
                label: "Pengingat Penilaian",
                icon: Bell,
                description: "Pengingat untuk menyelesaikan penilaian",
              },
              {
                key: "deadline",
                label: "Peringatan Deadline",
                icon: Clock,
                description: "Peringatan saat deadline mendekati",
              },
              {
                key: "completion",
                label: "Notifikasi Selesai",
                icon: CheckCircle,
                description: "Konfirmasi saat penilaian selesai",
              },
              {
                key: "system",
                label: "Pengumuman Sistem",
                icon: Info,
                description: "Pengumuman penting dari sistem",
              },
            ].map((type) => (
              <div
                key={type.key}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  notificationSettings.notification_types.includes(type.key)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => toggleNotificationType(type.key)}
              >
                <div className="flex items-center space-x-3">
                  <type.icon className="w-5 h-5 text-gray-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">{type.label}</h4>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reminder Frequency */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Frekuensi Pengingat
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seberapa sering Anda ingin menerima pengingat?
              </label>
              <select
                value={notificationSettings.reminder_frequency}
                onChange={(e) =>
                  handleSettingChange("reminder_frequency", e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="hourly">Setiap jam</option>
                <option value="daily">Setiap hari</option>
                <option value="weekly">Setiap minggu</option>
                <option value="monthly">Setiap bulan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Jam Tenang
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mulai Jam Tenang
              </label>
              <input
                type="time"
                value={notificationSettings.quiet_hours_start}
                onChange={(e) =>
                  handleSettingChange("quiet_hours_start", e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Akhir Jam Tenang
              </label>
              <input
                type="time"
                value={notificationSettings.quiet_hours_end}
                onChange={(e) =>
                  handleSettingChange("quiet_hours_end", e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <p className="text-sm text-gray-600 mt-3">
            Notifikasi tidak akan dikirim selama jam tenang (kecuali yang
            urgent)
          </p>
        </div>

        {/* Priority Levels */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Level Prioritas
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["low", "medium", "high", "urgent"].map((level) => (
              <button
                key={level}
                onClick={() => togglePriorityLevel(level)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  notificationSettings.priority_levels.includes(level)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {level}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <motion.button
            onClick={handleSaveSettings}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
            <span>{loading ? "Menyimpan..." : "Simpan Pengaturan"}</span>
          </motion.button>
        </div>

        {/* Notification Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <Info className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">
                Tips Notifikasi
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • Atur jam tenang untuk menghindari gangguan saat istirahat
                </li>
                <li>• Pilih frekuensi yang sesuai dengan jadwal kerja Anda</li>
                <li>
                  • Aktifkan notifikasi penting untuk tidak ketinggalan deadline
                </li>
                <li>
                  • Gunakan kombinasi email dan push untuk memastikan tidak ada
                  yang terlewat
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

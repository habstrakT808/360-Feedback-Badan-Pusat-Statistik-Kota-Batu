// src/components/settings/NotificationSettings.tsx
"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useStore } from "../../store/useStore";
import {
  Bell,
  Mail,
  Smartphone,
  Clock,
  Info,
  CheckCircle,
  Save,
  RefreshCw,
  Moon,
  Shield,
  AlertTriangle,
  Award,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  NotificationService,
  NotificationPreferences,
} from "../../lib/notification-service";

interface NotificationSettingsProps {
  profile?: any;
  onUpdate?: (profile: any) => void;
}

export function NotificationSettings({
  profile,
  onUpdate,
}: NotificationSettingsProps) {
  const { user } = useStore();
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const data = await NotificationService.getNotificationPreferences(
        user!.id
      );
      setPreferences(data);
    } catch (error) {
      console.error("Failed to load preferences:", error);
      toast.error("Gagal memuat pengaturan notifikasi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!preferences || !user) return;

    setIsSaving(true);
    try {
      await NotificationService.updateNotificationPreferences(
        user.id,
        preferences
      );
      toast.success("Pengaturan notifikasi berhasil disimpan!");

      if (onUpdate) {
        onUpdate(preferences);
      }
    } catch (error: any) {
      console.error("Failed to save notification preferences:", error);
      toast.error("Gagal menyimpan pengaturan notifikasi");
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    if (!preferences) return;

    setPreferences((prev) => ({
      ...prev!,
      [key]: value,
    }));
  };

  const toggleSwitch = (key: keyof NotificationPreferences) => {
    if (!preferences) return;
    updatePreference(key, !preferences[key]);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="text-center text-gray-500">
          <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Gagal memuat pengaturan notifikasi</p>
          <button
            onClick={loadPreferences}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <Bell className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Pengaturan Notifikasi
            </h2>
            <p className="text-gray-600">
              Kelola preferensi notifikasi dan pengingat Anda
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* General Settings */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-gray-600" />
            Pengaturan Umum
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-gray-900">
                    Notifikasi Email
                  </h4>
                  <p className="text-sm text-gray-600">
                    Terima notifikasi melalui email
                  </p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleSwitch("email_enabled")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.email_enabled ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.email_enabled
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </motion.button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <Smartphone className="w-5 h-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Notifikasi Push</h4>
                  <p className="text-sm text-gray-600">
                    Terima notifikasi di browser
                  </p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleSwitch("push_enabled")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.push_enabled ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.push_enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Notification Types */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-gray-600" />
            Jenis Notifikasi
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-orange-600" />
                <div>
                  <h4 className="font-medium text-gray-900">
                    Pengingat Penilaian
                  </h4>
                  <p className="text-sm text-gray-600">
                    Pengingat untuk menyelesaikan penilaian
                  </p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleSwitch("assessment_reminders")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.assessment_reminders
                    ? "bg-blue-600"
                    : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.assessment_reminders
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </motion.button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <h4 className="font-medium text-gray-900">
                    Peringatan Deadline
                  </h4>
                  <p className="text-sm text-gray-600">
                    Peringatan saat deadline mendekati
                  </p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleSwitch("deadline_warnings")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.deadline_warnings ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.deadline_warnings
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </motion.button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-gray-900">
                    Notifikasi Selesai
                  </h4>
                  <p className="text-sm text-gray-600">
                    Konfirmasi saat penilaian selesai
                  </p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleSwitch("completion_notifications")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.completion_notifications
                    ? "bg-blue-600"
                    : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.completion_notifications
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </motion.button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <Info className="w-5 h-5 text-purple-600" />
                <div>
                  <h4 className="font-medium text-gray-900">
                    Pengumuman Sistem
                  </h4>
                  <p className="text-sm text-gray-600">
                    Pengumuman penting dari sistem
                  </p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleSwitch("system_notifications")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.system_notifications
                    ? "bg-blue-600"
                    : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.system_notifications
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Reminder Frequency */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-gray-600" />
            Frekuensi Pengingat
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: "hourly", label: "Setiap Jam" },
              { value: "daily", label: "Harian" },
              { value: "weekly", label: "Mingguan" },
              { value: "monthly", label: "Bulanan" },
            ].map((frequency) => (
              <motion.button
                key={frequency.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() =>
                  updatePreference("reminder_frequency", frequency.value)
                }
                className={`p-3 rounded-xl border-2 transition-colors ${
                  preferences.reminder_frequency === frequency.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                {frequency.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Quiet Hours */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Moon className="w-5 h-5 mr-2 text-gray-600" />
            Jam Tenang
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Tidak ada notifikasi yang akan dikirim selama jam ini (kecuali yang
            urgent)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mulai Jam Tenang
              </label>
              <input
                type="time"
                value={preferences?.quiet_hours_start || "22:00"}
                onChange={(e) =>
                  updatePreference("quiet_hours_start", e.target.value)
                }
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Akhir Jam Tenang
              </label>
              <input
                type="time"
                value={preferences?.quiet_hours_end || "08:00"}
                onChange={(e) =>
                  updatePreference("quiet_hours_end", e.target.value)
                }
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={loadPreferences}
            disabled={isSaving}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <Info className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">
                Tips Pengaturan Notifikasi
              </h4>
              <ul className="text-sm text-blue-800 space-y-2">
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  Atur jam tenang untuk menghindari gangguan saat istirahat
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  Pilih frekuensi pengingat yang sesuai dengan jadwal kerja Anda
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  Aktifkan peringatan deadline untuk tidak ketinggalan batas
                  waktu
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  Gunakan kombinasi email dan push notification untuk hasil
                  optimal
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

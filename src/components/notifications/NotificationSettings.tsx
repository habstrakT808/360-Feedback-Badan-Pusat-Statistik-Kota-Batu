// src/components/notifications/NotificationSettings.tsx
"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Mail, Clock, Shield, Moon, Save, RefreshCw } from "lucide-react";
import { NotificationService } from "@/lib/notification-service";
import { useStore } from "@/store/useStore";
import { toast } from "react-hot-toast";

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useStore();

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      const data = await NotificationService.getNotificationPreferences(
        user!.id
      );
      setPreferences(data || getDefaultPreferences());
    } catch (error) {
      console.error("Failed to load preferences:", error);
      setPreferences(getDefaultPreferences());
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultPreferences = () => ({
    email_enabled: true,
    push_enabled: true,
    assessment_reminders: true,
    deadline_warnings: true,
    completion_notifications: true,
    system_notifications: true,
    reminder_frequency: "weekly",
    quiet_hours_start: "22:00",
    quiet_hours_end: "08:00",
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await NotificationService.updateNotificationPreferences(
        user!.id,
        preferences
      );
      toast.success("Notification preferences saved!");
    } catch (error: any) {
      toast.error("Failed to save preferences: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = (key: string, value: any) => {
    setPreferences((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
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
              Notification Settings
            </h2>
            <p className="text-gray-600">
              Manage your notification preferences
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* General Settings */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-gray-600" />
            General Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">
                  Email Notifications
                </h4>
                <p className="text-sm text-gray-600">
                  Receive notifications via email
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  updatePreference("email_enabled", !preferences.email_enabled)
                }
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

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">
                  Push Notifications
                </h4>
                <p className="text-sm text-gray-600">
                  Receive browser notifications
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  updatePreference("push_enabled", !preferences.push_enabled)
                }
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
            Notification Types
          </h3>
          <div className="space-y-4">
            {[
              {
                key: "assessment_reminders",
                title: "Assessment Reminders",
                description: "Get reminded about pending assessments",
              },
              {
                key: "deadline_warnings",
                title: "Deadline Warnings",
                description: "Alerts when assessment deadlines are approaching",
              },
              {
                key: "completion_notifications",
                title: "Completion Notifications",
                description: "Confirmations when you complete assessments",
              },
              {
                key: "system_notifications",
                title: "System Notifications",
                description: "Important system updates and announcements",
              },
            ].map((setting) => (
              <div
                key={setting.key}
                className="flex items-center justify-between"
              >
                <div>
                  <h4 className="font-medium text-gray-900">{setting.title}</h4>
                  <p className="text-sm text-gray-600">{setting.description}</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    updatePreference(setting.key, !preferences[setting.key])
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences[setting.key] ? "bg-blue-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences[setting.key]
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </motion.button>
              </div>
            ))}
          </div>
        </div>

        {/* Reminder Frequency */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-gray-600" />
            Reminder Frequency
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {["daily", "weekly", "monthly"].map((frequency) => (
              <motion.button
                key={frequency}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() =>
                  updatePreference("reminder_frequency", frequency)
                }
                className={`p-3 rounded-xl border-2 transition-colors capitalize ${
                  preferences.reminder_frequency === frequency
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                {frequency}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Quiet Hours */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Moon className="w-5 h-5 mr-2 text-gray-600" />
            Quiet Hours
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            No notifications will be sent during these hours
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={preferences.quiet_hours_start}
                onChange={(e) =>
                  updatePreference("quiet_hours_start", e.target.value)
                }
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={preferences.quiet_hours_end}
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
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

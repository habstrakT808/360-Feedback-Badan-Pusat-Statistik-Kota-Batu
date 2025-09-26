// src/components/settings/SecuritySettings.tsx
"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SettingsService } from "@/lib/settings-service";
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  Key,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-hot-toast";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini diperlukan"),
    newPassword: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password diperlukan"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export function SecuritySettings() {
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const newPassword = watch("newPassword");

  const onSubmit = async (data: PasswordFormData) => {
    setLoading(true);
    try {
      await SettingsService.changePassword(data.newPassword);
      toast.success("Password berhasil diubah");
      reset();
    } catch (error: any) {
      toast.error(error.message || "Gagal mengubah password");
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "", color: "" };

    let strength = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    strength = Object.values(checks).filter(Boolean).length;

    const labels = ["Sangat Lemah", "Lemah", "Cukup", "Kuat", "Sangat Kuat"];
    const colors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-blue-500",
      "bg-green-500",
    ];

    return {
      strength,
      label: labels[strength - 1] || "",
      color: colors[strength - 1] || "",
      checks,
    };
  };

  const passwordStrength = getPasswordStrength(newPassword || "");

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center space-x-3 mb-6">
        <Shield className="w-6 h-6 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Keamanan</h2>
          <p className="text-gray-600">
            Kelola password dan keamanan akun Anda
          </p>
        </div>
      </div>

      {/* Security Status */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <h3 className="font-semibold text-green-900">Akun Aman</h3>
            <p className="text-sm text-green-700">
              Akun Anda terlindungi dengan autentikasi internal
            </p>
          </div>
        </div>
      </div>

      {/* Change Password Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Key className="w-5 h-5" />
            <span>Ubah Password</span>
          </h3>

          <div className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Saat Ini
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register("currentPassword")}
                  type={showPasswords.current ? "text" : "password"}
                  className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.currentPassword
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                  placeholder="Masukkan password saat ini"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords((prev) => ({
                      ...prev,
                      current: !prev.current,
                    }))
                  }
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.currentPassword.message}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Baru
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register("newPassword")}
                  type={showPasswords.new ? "text" : "password"}
                  className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.newPassword ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Masukkan password baru"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords((prev) => ({ ...prev, new: !prev.new }))
                  }
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.newPassword.message}
                </p>
              )}

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      Kekuatan Password:
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        passwordStrength.strength <= 2
                          ? "text-red-600"
                          : passwordStrength.strength <= 3
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{
                        width: `${(passwordStrength.strength / 5) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div
                      className={`flex items-center space-x-1 ${
                        passwordStrength.checks?.length
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>8+ karakter</span>
                    </div>
                    <div
                      className={`flex items-center space-x-1 ${
                        passwordStrength.checks?.uppercase
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Huruf besar</span>
                    </div>
                    <div
                      className={`flex items-center space-x-1 ${
                        passwordStrength.checks?.lowercase
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Huruf kecil</span>
                    </div>
                    <div
                      className={`flex items-center space-x-1 ${
                        passwordStrength.checks?.numbers
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Angka</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register("confirmPassword")}
                  type={showPasswords.confirm ? "text" : "password"}
                  className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.confirmPassword
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                  placeholder="Konfirmasi password baru"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords((prev) => ({
                      ...prev,
                      confirm: !prev.confirm,
                    }))
                  }
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Security Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">
                Tips Keamanan
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Gunakan password yang unik dan kuat</li>
                <li>• Jangan gunakan informasi pribadi dalam password</li>
                <li>• Ubah password secara berkala</li>
                <li>• Jangan bagikan password kepada siapapun</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Shield className="w-5 h-5" />
            )}
            <span>{loading ? "Mengubah..." : "Ubah Password"}</span>
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}

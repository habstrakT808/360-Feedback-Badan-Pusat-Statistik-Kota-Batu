// src/components/admin/EditUserModal.tsx
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminService } from "@/lib/admin-service";
import {
  User,
  Mail,
  Briefcase,
  Building,
  Save,
  X,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "react-hot-toast";

const editUserSchema = z.object({
  full_name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  position: z.string().optional(),
  department: z.string().optional(),
  username: z.string().min(3, "Username minimal 3 karakter"),
  new_password: z.string().min(8, "Password minimal 8 karakter").optional(),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

interface EditUserModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
}

export function EditUserModal({
  user,
  isOpen,
  onClose,
  onUserUpdated,
}: EditUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
  });

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      setValue("full_name", user.full_name || "");
      setValue("email", user.email || "");
      setValue("position", user.position || "");
      setValue("department", user.department || "");
      setValue("username", user.username || "");
    }
  }, [user, setValue]);

  const onSubmit = async (data: EditUserFormData) => {
    if (!user) return;

    setLoading(true);
    try {
      // Update user profile
      await AdminService.updateUser(user.id, {
        full_name: data.full_name,
        position: data.position,
        department: data.department,
        username: data.username,
      });

      // Handle email change separately if changed
      if (data.email !== user.email) {
        await AdminService.updateUserEmail(user.id, data.email);
      }

      // Handle password change if provided
      if (newPassword.trim()) {
        await AdminService.updateUserPassword(user.id, newPassword);
        setNewPassword("");
      }

      toast.success("User berhasil diperbarui");
      onUserUpdated();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui user");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user) return;

    if (!confirm("Reset password user ini ke '12345678'?")) {
      return;
    }

    setResetPasswordLoading(true);
    try {
      await AdminService.resetUserPassword(user.id);
      toast.success("Password berhasil direset ke '12345678'");
    } catch (error: any) {
      toast.error(error.message || "Gagal reset password");
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setNewPassword("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Edit User
                      </h2>
                      <p className="text-gray-600">Update user information</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* User Info */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      User Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nama Lengkap
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            {...register("full_name")}
                            type="text"
                            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                              errors.full_name
                                ? "border-red-300"
                                : "border-gray-300"
                            }`}
                            placeholder="Masukkan nama lengkap"
                          />
                        </div>
                        {errors.full_name && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.full_name.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Username
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            {...register("username")}
                            type="text"
                            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                              errors.username
                                ? "border-red-300"
                                : "border-gray-300"
                            }`}
                            placeholder="Masukkan username"
                          />
                        </div>
                        {errors.username && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.username.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            {...register("email")}
                            type="email"
                            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                              errors.email
                                ? "border-red-300"
                                : "border-gray-300"
                            }`}
                            placeholder="Masukkan email"
                          />
                        </div>
                        {errors.email && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.email.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Posisi/Jabatan
                        </label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            {...register("position")}
                            type="text"
                            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                              errors.position
                                ? "border-red-300"
                                : "border-gray-300"
                            }`}
                            placeholder="Masukkan posisi"
                          />
                        </div>
                        {errors.position && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.position.message}
                          </p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Departemen
                        </label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            {...register("department")}
                            type="text"
                            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                              errors.department
                                ? "border-red-300"
                                : "border-gray-300"
                            }`}
                            placeholder="Masukkan departemen"
                          />
                        </div>
                        {errors.department && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.department.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Password Section */}
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Key className="w-5 h-5 text-orange-600" />
                      <span>Password Management</span>
                    </h3>

                    <div className="space-y-4">
                      {/* Quick Reset Password */}
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Reset Password
                          </h4>
                          <p className="text-sm text-gray-600">
                            Reset password ke default: 12345678
                          </p>
                        </div>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleResetPassword}
                          disabled={resetPasswordLoading}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                        >
                          {resetPasswordLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Key className="w-4 h-4" />
                          )}
                          <span>
                            {resetPasswordLoading
                              ? "Resetting..."
                              : "Reset Password"}
                          </span>
                        </motion.button>
                      </div>

                      {/* Set New Password */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Set Password Baru (Opsional)
                        </label>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Masukkan password baru (minimal 6 karakter)"
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          >
                            {showPassword ? (
                              <EyeOff className="w-5 h-5 text-gray-400" />
                            ) : (
                              <Eye className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                        {newPassword && newPassword.length < 6 && (
                          <p className="text-red-500 text-sm">
                            Password minimal 6 karakter
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleClose}
                      className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                    >
                      Batal
                    </motion.button>
                    <motion.button
                      type="submit"
                      disabled={loading || (!isDirty && !newPassword.trim())}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                        loading || (!isDirty && !newPassword.trim())
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      <span>
                        {loading ? "Menyimpan..." : "Simpan Perubahan"}
                      </span>
                    </motion.button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

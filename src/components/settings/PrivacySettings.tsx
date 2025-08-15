// src/components/settings/PrivacySettings.tsx
"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { SettingsService } from "@/lib/settings-service";
import { useStore } from "@/store/useStore";
import { Eye, EyeOff, Globe, Lock, Users, Shield, Info } from "lucide-react";
import { toast } from "react-hot-toast";

interface PrivacySettingsProps {
  profile: any;
  onUpdate: (profile: any) => void;
}

export function PrivacySettings({ profile, onUpdate }: PrivacySettingsProps) {
  const { user } = useStore();
  const [loading, setLoading] = useState(false);

  const handlePublicViewToggle = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const updatedProfile = await SettingsService.updateProfile(user.id, {
        allow_public_view: !profile.allow_public_view,
      });
      onUpdate(updatedProfile);
      toast.success(
        updatedProfile.allow_public_view
          ? "Hasil Anda sekarang dapat dilihat publik"
          : "Hasil Anda sekarang bersifat privat"
      );
    } catch (error: any) {
      toast.error(error.message || "Gagal mengubah pengaturan privasi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center space-x-3 mb-6">
        <Eye className="w-6 h-6 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Privasi</h2>
          <p className="text-gray-600">
            Kontrol siapa yang dapat melihat informasi Anda
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Visibility Settings */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Visibilitas Hasil
          </h3>

          <div className="space-y-4">
            {/* Public View Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-start space-x-3">
                {profile?.allow_public_view ? (
                  <Globe className="w-6 h-6 text-green-600 mt-1" />
                ) : (
                  <Lock className="w-6 h-6 text-gray-600 mt-1" />
                )}
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Tampilkan Hasil Secara Publik
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {profile?.allow_public_view
                      ? "Semua karyawan dapat melihat hasil penilaian Anda"
                      : "Hanya Anda dan admin yang dapat melihat hasil penilaian Anda"}
                  </p>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handlePublicViewToggle}
                disabled={loading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  profile?.allow_public_view ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <motion.span
                  animate={{
                    x: profile?.allow_public_view ? 20 : 2,
                  }}
                  className="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform"
                />
              </motion.button>
            </div>

            {/* Status Indicator */}
            <div
              className={`p-4 rounded-xl border-l-4 ${
                profile?.allow_public_view
                  ? "bg-green-50 border-green-500"
                  : "bg-blue-50 border-blue-500"
              }`}
            >
              <div className="flex items-center space-x-2">
                {profile?.allow_public_view ? (
                  <Eye className="w-5 h-5 text-green-600" />
                ) : (
                  <EyeOff className="w-5 h-5 text-blue-600" />
                )}
                <span
                  className={`font-semibold ${
                    profile?.allow_public_view
                      ? "text-green-900"
                      : "text-blue-900"
                  }`}
                >
                  Status: {profile?.allow_public_view ? "Publik" : "Privat"}
                </span>
              </div>
              <p
                className={`text-sm mt-1 ${
                  profile?.allow_public_view
                    ? "text-green-800"
                    : "text-blue-800"
                }`}
              >
                {profile?.allow_public_view
                  ? "Hasil penilaian Anda dapat dilihat oleh semua karyawan di halaman Tim"
                  : "Hasil penilaian Anda hanya dapat dilihat oleh Anda dan administrator"}
              </p>
            </div>
          </div>
        </div>

        {/* Data Usage Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <Info className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Penggunaan Data
              </h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p>
                  • Data penilaian Anda digunakan untuk evaluasi kinerja
                  internal
                </p>
                <p>• Feedback yang Anda berikan selalu bersifat anonim</p>
                <p>
                  • Administrator dapat mengakses data untuk keperluan analisis
                  tim
                </p>
                <p>
                  • Data tidak akan dibagikan kepada pihak ketiga tanpa
                  persetujuan
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Controls */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Kontrol Privasi Lainnya</span>
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div>
                <h4 className="font-medium text-gray-900">
                  Profil di Halaman Tim
                </h4>
                <p className="text-sm text-gray-600">
                  Tampilkan informasi dasar Anda di halaman tim
                </p>
              </div>
              <div className="text-sm text-gray-500">Selalu Aktif</div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div>
                <h4 className="font-medium text-gray-900">Riwayat Penilaian</h4>
                <p className="text-sm text-gray-600">
                  Simpan riwayat penilaian untuk analisis tren
                </p>
              </div>
              <div className="text-sm text-gray-500">Selalu Aktif</div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div>
                <h4 className="font-medium text-gray-900">
                  Anonimitas Feedback
                </h4>
                <p className="text-sm text-gray-600">
                  Feedback yang Anda berikan selalu anonim
                </p>
              </div>
              <div className="text-sm text-green-600 font-medium">Terjamin</div>
            </div>
          </div>
        </div>

        {/* Data Export */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Data Anda
          </h3>
          <p className="text-gray-600 mb-4">
            Anda memiliki kontrol penuh atas data pribadi Anda.
          </p>

          <div className="flex space-x-3">
            <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
              Unduh Data Saya
            </button>
            <button className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors">
              Hapus Akun
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// src/app/pins/page.tsx
"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUserRole } from "@/hooks/useUserRole";
import { useStore } from "@/store/useStore";
import { PinService, PinRanking } from "@/lib/pin-service";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loading } from "@/components/ui/Loading";
import { PinCard } from "@/components/pin/PinCard";
import { PinHistory } from "@/components/pin/PinHistory";
import { EmployeeCard } from "@/components/pin/EmployeeCard";
import { PinDetailModal } from "@/components/pin/PinDetailModal";
import { toast } from "react-hot-toast";
import {
  Pin,
  Trophy,
  Calendar,
  Users,
  Award,
  Star,
  TrendingUp,
  Clock,
  AlertCircle,
} from "lucide-react";

export default function PinsPage() {
  const { user } = useStore();
  const { isAdmin, isSupervisor, isLoading: roleLoading } = useUserRole();
  const [weeklyRanking, setWeeklyRanking] = useState<PinRanking[]>([]);
  const [monthlyRanking, setMonthlyRanking] = useState<PinRanking[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pinsRemaining, setPinsRemaining] = useState(4);
  const [isGivingPin, setIsGivingPin] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "give" | "weekly" | "monthly" | "history"
  >("give");
  const [selectedUser, setSelectedUser] = useState<PinRanking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Hapus pemanggilan createTestPins yang sudah dinonaktifkan
      // await PinService.createTestPins(user!.id);

      const [weekly, monthly, allowance, members] = await Promise.all([
        PinService.getWeeklyRanking(),
        PinService.getMonthlyRanking(),
        PinService.getWeeklyPinAllowance(user!.id),
        PinService.getAvailableTeamMembers(user!.id),
      ]);

      // Debug: Log semua user ID untuk mengidentifikasi duplikat
      console.log("=== DEBUG: User IDs ===");
      console.log(
        "Weekly Ranking IDs:",
        weekly.map((u) => u.user_id)
      );
      console.log(
        "Monthly Ranking IDs:",
        monthly.map((u) => u.user_id)
      );
      console.log(
        "Team Members IDs:",
        members.map((m) => m.id)
      );
      console.log("========================");

      setWeeklyRanking(weekly);
      setMonthlyRanking(monthly);
      setTeamMembers(members);
      setPinsRemaining(allowance?.pins_remaining || 0);
    } catch (error: any) {
      console.error("Error loading pin data:", error);
      toast.error("Gagal memuat data pin: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGivePin = async (receiverId: string) => {
    if (!user?.id) return;

    try {
      setIsGivingPin(true);
      await PinService.givePin(user.id, receiverId);

      toast.success("Pin berhasil diberikan!");

      // Reload data
      await loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsGivingPin(false);
    }
  };

  const handleCardClick = (clickedUser: PinRanking) => {
    setSelectedUser(clickedUser);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const isFriday = PinService.isFriday();
  const currentWeek = PinService.getCurrentWeekNumber();
  const currentYear = PinService.getCurrentYear();
  const currentMonth = PinService.getCurrentMonth();

  const getMonthName = (month: number) => {
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    return months[month - 1];
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-20">
          <Loading size="lg" text="Memuat sistem pin..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl">
              <Pin className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                Sistem Pin
              </h1>
              <p className="text-gray-600 text-lg">
                Berikan pin kepada rekan kerja yang membantu Anda
              </p>
            </div>
          </div>
        </motion.div>

        {/* Status Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pin Allowance */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
              <div className="flex items-center space-x-3 mb-3">
                <Pin className="w-6 h-6" />
                <h3 className="text-lg font-semibold">Pin Tersisa</h3>
              </div>
              <div className="text-3xl font-bold mb-2">{pinsRemaining}</div>
              <p className="text-blue-100 text-sm">dari 4 pin mingguan</p>
            </div>

            {/* Current Period */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
              <div className="flex items-center space-x-3 mb-3">
                <Calendar className="w-6 h-6" />
                <h3 className="text-lg font-semibold">Periode Saat Ini</h3>
              </div>
              <div className="text-lg font-semibold mb-2">
                Minggu {currentWeek}, {currentYear}
              </div>
              <p className="text-green-100 text-sm">
                {getMonthName(currentMonth)} {currentYear}
              </p>
            </div>

            {/* Status */}
            <div
              className={`rounded-2xl p-6 text-white ${
                isFriday
                  ? "bg-gradient-to-r from-green-500 to-emerald-600"
                  : "bg-gradient-to-r from-gray-500 to-gray-600"
              }`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <Clock className="w-6 h-6" />
                <h3 className="text-lg font-semibold">Status</h3>
              </div>
              <div className="text-lg font-semibold mb-2">
                {isFriday ? "Pin Dapat Diberikan" : "Pin Tidak Dapat Diberikan"}
              </div>
              <p className="text-sm opacity-90">
                {isFriday
                  ? process.env.NODE_ENV === "development" ||
                    process.env.NEXT_PUBLIC_ENABLE_PIN_TESTING === "true"
                    ? "Developer mode aktif - testing tanpa batasan"
                    : "Pin dapat diberikan hari ini!"
                  : "Pin hanya dapat diberikan pada hari Jumat"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Developer Mode Info */}
        {(process.env.NODE_ENV === "development" ||
          process.env.NEXT_PUBLIC_ENABLE_PIN_TESTING === "true") && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl"
          >
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">DEV</span>
              </div>
              <div>
                <h4 className="font-semibold text-green-800">
                  🧪 Developer Mode Aktif
                </h4>
                <p className="text-green-700 text-sm">
                  Sistem pin dapat diakses untuk testing tanpa batasan hari
                  Jumat. Fitur ini hanya tersedia dalam mode development.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Warning for Non-Friday (Production Only) */}
        {!isFriday &&
          process.env.NODE_ENV === "production" &&
          process.env.NEXT_PUBLIC_ENABLE_PIN_TESTING !== "true" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl"
            >
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
                <div>
                  <h4 className="font-semibold text-yellow-800">
                    Pin Hanya Dapat Diberikan pada Hari Jumat
                  </h4>
                  <p className="text-yellow-700 text-sm">
                    Sistem pin akan aktif setiap hari Jumat dari jam 00:00
                    hingga 23:59. Perangkingan akan di-reset setiap hari Sabtu.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-2xl">
            {[
              { id: "give", label: "Berikan Pin", icon: Pin },
              { id: "weekly", label: "Peringkat Mingguan", icon: Calendar },
              { id: "monthly", label: "Peringkat Bulanan", icon: Trophy },
              { id: "history", label: "Riwayat Pin", icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-white text-blue-600 shadow-lg"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Give Pin */}
          {activeTab === "give" && (
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl">
                  <Pin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Berikan Pin
                  </h2>
                  <p className="text-gray-600">
                    Pilih rekan kerja (termasuk diri sendiri) yang ingin Anda
                    berikan pin
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    * Admin tidak ditampilkan dalam daftar ini
                  </p>
                </div>
              </div>

              {teamMembers.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100">
                  <Users className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-500 mb-2">
                    Tidak ada rekan kerja yang tersedia
                  </h3>
                  <p className="text-gray-400">
                    Semua user mungkin sudah admin atau tidak ada data
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {teamMembers.map((member, index) => (
                    <EmployeeCard
                      key={`member-${member.id}-${index}`} // Gunakan kombinasi ID dan index
                      employee={member}
                      onGivePin={handleGivePin}
                      canGivePin={isFriday && pinsRemaining > 0}
                      isGivingPin={isGivingPin}
                      isCurrentUser={member.id === user?.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Weekly Ranking */}
          {activeTab === "weekly" && (
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    The Most Helpful Employee of the Week
                  </h2>
                  <p className="text-gray-600">
                    Peringkat minggu {currentWeek}, {currentYear}
                  </p>
                </div>
              </div>

              {weeklyRanking.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100">
                  <Pin className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-500 mb-2">
                    Belum ada pin yang diberikan minggu ini
                  </h3>
                  <p className="text-gray-400">
                    {isFriday
                      ? "Mulai berikan pin kepada rekan kerja Anda"
                      : "Mulai berikan pin kepada rekan kerja Anda pada hari Jumat"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {weeklyRanking.map((rankingUser, index) => (
                    <PinCard
                      key={`weekly-${rankingUser.user_id}-${index}`} // Gunakan kombinasi ID dan index
                      user={rankingUser}
                      onGivePin={handleGivePin}
                      canGivePin={isFriday && pinsRemaining > 0 && !isGivingPin}
                      pinsRemaining={pinsRemaining}
                      isCurrentUser={rankingUser.user_id === user?.id}
                      onCardClick={handleCardClick}
                      periodType="weekly"
                      periodInfo={{
                        weekNumber: currentWeek,
                        year: currentYear,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Monthly Ranking */}
          {activeTab === "monthly" && (
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Employee of the Month
                  </h2>
                  <p className="text-gray-600">
                    Nominasi {getMonthName(currentMonth)} {currentYear}
                  </p>
                </div>
              </div>

              {monthlyRanking.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100">
                  <Award className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-500 mb-2">
                    Belum ada pin yang diberikan bulan ini
                  </h3>
                  <p className="text-gray-400">
                    Perangkingan bulanan akan diperbarui setiap tanggal 1
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {monthlyRanking.map((rankingUser, index) => (
                    <PinCard
                      key={`monthly-${rankingUser.user_id}-${index}`} // Gunakan kombinasi ID dan index
                      user={rankingUser}
                      onGivePin={handleGivePin}
                      canGivePin={isFriday && pinsRemaining > 0 && !isGivingPin}
                      pinsRemaining={pinsRemaining}
                      isCurrentUser={rankingUser.user_id === user?.id}
                      onCardClick={handleCardClick}
                      periodType="monthly"
                      periodInfo={{
                        month: currentMonth,
                        year: currentYear,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pin History */}
          {activeTab === "history" && (
            <div>
              <PinHistory />
            </div>
          )}
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200"
        >
          <div className="text-center">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              Cara Kerja Sistem Pin
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-blue-700">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  1
                </div>
                <span>Setiap user mendapat 4 pin per minggu</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  2
                </div>
                <span>Pin hanya dapat diberikan pada hari Jumat</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  3
                </div>
                <span>Peringkat di-reset setiap minggu dan bulan</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Pin Detail Modal */}
      {selectedUser && (
        <PinDetailModal
          isOpen={isModalOpen}
          onClose={closeModal}
          user={selectedUser}
          periodType={activeTab === "weekly" ? "weekly" : "monthly"}
          periodInfo={
            activeTab === "weekly"
              ? { weekNumber: 35, year: currentYear } // Gunakan week 35 yang sudah diupdate di database
              : { month: currentMonth, year: currentYear }
          }
        />
      )}
    </DashboardLayout>
  );
}

// src/app/pins/page.tsx
"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUserRole } from "@/hooks/useUserRole";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { PinService, PinRanking } from "@/lib/pin-service";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loading } from "@/components/ui/Loading";
import { PinCard } from "@/components/pin/PinCard";
import { PinHistory } from "@/components/pin/PinHistory";
import { EmployeeCard } from "@/components/pin/EmployeeCard";
import { PinDetailModal } from "@/components/pin/PinDetailModal";
import { toast } from "react-hot-toast";
import { PinPeriodService } from "@/lib/pin-period-service";
import {
  Pin,
  Calendar,
  Users,
  Award,
  Star,
  TrendingUp,
  Clock,
} from "lucide-react";

export default function PinsPage() {
  const { user } = useStore();
  const { isAdmin, isSupervisor, isLoading: roleLoading } = useUserRole();
  const router = useRouter();
  const [monthlyRanking, setMonthlyRanking] = useState<PinRanking[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pinsRemaining, setPinsRemaining] = useState(4);
  const [isGivingPin, setIsGivingPin] = useState(false);
  const [activeTab, setActiveTab] = useState<"give" | "monthly" | "history">(
    "give"
  );
  const [selectedUser, setSelectedUser] = useState<PinRanking | null>(null);
  const currentWeek = PinService.getCurrentWeekNumber();
  const currentYear = PinService.getCurrentYear();
  const currentMonth = PinService.getCurrentMonth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePinPeriod, setActivePinPeriod] = useState<any | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [givenReceiverIds, setGivenReceiverIds] = useState<string[]>([]);
  const [givenReceiverCounts, setGivenReceiverCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isAdmin) {
      router.replace("/admin");
    }
  }, [isAdmin, router]);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id, selectedMonth, selectedYear]);

  // Sinkronkan pilihan bulan/tahun awal dengan periode aktif saat tersedia
  useEffect(() => {
    if (activePinPeriod && (selectedMonth === null || selectedYear === null)) {
      setSelectedMonth(activePinPeriod.month ?? currentMonth);
      setSelectedYear(activePinPeriod.year ?? currentYear);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePinPeriod]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Hapus pemanggilan createTestPins yang sudah dinonaktifkan
      // await PinService.createTestPins(user!.id);

      const [pinPeriod] = await Promise.all([PinPeriodService.getActive()]);

      // Tentukan bulan/tahun target dari pilihan atau periode aktif
      const targetMonth = (selectedMonth ||
        pinPeriod?.month ||
        currentMonth) as number;
      const targetYear = (selectedYear ||
        pinPeriod?.year ||
        currentYear) as number;

      // Tentukan filter periode untuk ranking: pilih bulan/tahun jika ada; jika tidak gunakan rentang periode aktif
      const rankingPeriod: any = (selectedMonth && selectedYear)
        ? { month: targetMonth, year: targetYear }
        : (activePinPeriod
            ? { start: new Date(activePinPeriod.start_date).toISOString().slice(0,10), end: new Date(activePinPeriod.end_date).toISOString().slice(0,10) }
            : 'active')

      // Pastikan riwayat menggunakan periode yang sama dengan UI (bulan/tahun terpilih atau aktif)
      const historyUrl = (() => {
        const qs = new URLSearchParams()
        qs.set('month', String(targetMonth))
        qs.set('year', String(targetYear))
        return `/api/pins/history?${qs.toString()}`
      })()

      const [monthly, allowance, members, history] = await Promise.all([
        PinService.getPinRankings(50, rankingPeriod),
        PinService.getWeeklyPinAllowance(user!.id, targetMonth, targetYear),
        PinService.getParticipants(),
        fetch(historyUrl, { cache: 'no-store' }).then(r => r.json()).then(j => (Array.isArray(j?.pins) ? j.pins : [])),
      ]);

      // Debug: Log semua user ID untuk mengidentifikasi duplikat
      console.log("=== DEBUG: User IDs ===");
      console.log(
        "Monthly Ranking IDs:",
        monthly.map((u) => u.user_id)
      );
      console.log(
        "Pin Statistics:",
        members
      );
      console.log("========================");

      setMonthlyRanking(monthly);
      setTeamMembers(members);
      setPinsRemaining(allowance?.pins_remaining || 0);
      setActivePinPeriod(pinPeriod);
      // Tandai user yang sudah diberi pin oleh current user.
      // API /api/pins/history (tanpa receiverId) sudah otomatis mengembalikan
      // pin yang DIBERIKAN oleh pengguna saat ini pada periode aktif.
      // Jadi kita tidak perlu memfilter lagi berdasarkan giver_id,
      // cukup kumpulkan semua receiver_id dari hasil tersebut.
      const receivers = Array.isArray(history)
        ? history.filter((h: any) => !!h.receiver_id)
        : [];
      const counts: Record<string, number> = {};
      for (const h of receivers) {
        const rid = h.receiver_id as string;
        counts[rid] = (counts[rid] || 0) + 1;
      }
      setGivenReceiverCounts(counts);
      setGivenReceiverIds(Object.keys(counts));
      // Sinkronkan filter UI ke periode aktif bila belum dipilih
      if (pinPeriod && (selectedMonth === null || selectedYear === null)) {
        setSelectedMonth(pinPeriod.month ?? currentMonth);
        setSelectedYear(pinPeriod.year ?? currentYear);
      }
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

  const todayStr = new Date().toISOString().slice(0, 10);
  const isWithinActivePinPeriod = (() => {
    if (!activePinPeriod) return false;
    try {
      const start = new Date(activePinPeriod.start_date).toISOString().slice(0, 10);
      const end = new Date(activePinPeriod.end_date).toISOString().slice(0, 10);
      return todayStr >= start && todayStr <= end;
    } catch {
      return false;
    }
  })();

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
                Employee of the Month
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
              <p className="text-blue-100 text-sm">dari 4 pin bulanan</p>
            </div>

            {/* Current Period */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
              <div className="flex items-center space-x-3 mb-3">
                <Calendar className="w-6 h-6" />
                <h3 className="text-lg font-semibold">Periode Saat Ini</h3>
              </div>
              <div className="text-lg font-semibold mb-2">
                Minggu {currentWeek}, {activePinPeriod?.year || currentYear}
              </div>
              <p className="text-green-100 text-sm">
                {getMonthName(activePinPeriod?.month || currentMonth)}{" "}
                {activePinPeriod?.year || currentYear}
              </p>
            </div>

            {/* Status */}
            <div
              className={`rounded-2xl p-6 text-white ${
                isWithinActivePinPeriod
                  ? "bg-gradient-to-r from-green-500 to-emerald-600"
                  : "bg-gradient-to-r from-gray-500 to-gray-600"
              }`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <Clock className="w-6 h-6" />
                <h3 className="text-lg font-semibold">Status</h3>
              </div>
              <div className="text-lg font-semibold mb-2">
                {isWithinActivePinPeriod
                  ? "Pin Dapat Diberikan"
                  : "Pin Tidak Dapat Diberikan"}
              </div>
              <p className="text-sm opacity-90">
                {isWithinActivePinPeriod
                  ? "Periode pin sedang aktif. Anda dapat memberikan pin."
                  : "Periode pin belum dimulai atau telah berakhir."}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Warning if pin period not started */}
        {!isWithinActivePinPeriod && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl"
          >
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                !
              </div>
              <div>
                <h4 className="font-semibold text-yellow-800">
                  Periode pin belum dimulai
                </h4>
                <p className="text-yellow-700 text-sm">
                  Silakan tunggu hingga periode aktif dimulai oleh admin.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Friday-only warning removed per request */}

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
              { id: "monthly", label: "Peringkat Bulanan", icon: Award },
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
                      canGivePin={
                        isWithinActivePinPeriod &&
                        pinsRemaining > 0 &&
                        !isGivingPin
                      }
                      isGivingPin={isGivingPin}
                      isCurrentUser={member.id === user?.id}
                      hasGivenPin={givenReceiverIds.includes(member.id)}
                      givenPinCount={givenReceiverCounts[member.id] || 0}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Weekly ranking removed */}

          {/* Monthly Ranking */}
          {activeTab === "monthly" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Employee of the Month
                    </h2>
                    <p className="text-gray-600">
                      Nominasi{" "}
                      {getMonthName(
                        (selectedMonth ??
                          activePinPeriod?.month ??
                          currentMonth) as number
                      )}{" "}
                      {
                        (selectedYear ??
                          activePinPeriod?.year ??
                          currentYear) as number
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={
                      (selectedMonth ?? activePinPeriod?.month ?? "") as any
                    }
                    onChange={(e) =>
                      setSelectedMonth(
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Semua Bulan</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {getMonthName(m)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={(selectedYear ?? activePinPeriod?.year ?? "") as any}
                    onChange={(e) =>
                      setSelectedYear(
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Semua Tahun</option>
                    {Array.from(
                      { length: 6 },
                      (_, i) => currentYear - 4 + i
                    ).map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  {(selectedMonth || selectedYear) && (
                    <button
                      onClick={() => {
                        setSelectedMonth(null);
                        setSelectedYear(null);
                      }}
                      className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {monthlyRanking.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100">
                  <Award className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-500 mb-2">
                    Tidak ada riwayat pada bulan ini
                  </h3>
                  <p className="text-gray-400">
                    {getMonthName(
                      (selectedMonth ??
                        activePinPeriod?.month ??
                        currentMonth) as number
                    )}{" "}
                    {
                      (selectedYear ??
                        activePinPeriod?.year ??
                        currentYear) as number
                    }
                  </p>
                </div>
              ) : (
                <div>
                  {(() => {
                    const topFive = monthlyRanking.slice(0, 5);
                    const [first, second, third, fourth, fifth] = topFive;
                    return (
                      <>
                        {/* Podium Top 3 */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                          {/* Rank 2 */}
                          <div className="flex flex-col items-center justify-end">
                            {second && (
                              <div
                                onClick={() => handleCardClick(second)}
                                className="cursor-pointer w-full max-w-[220px]"
                              >
                                <div className="flex flex-col items-center">
                                  <img
                                    src={second.avatar_url || "/logo-bps.png"}
                                    alt={second.full_name}
                                    className="w-20 h-20 rounded-full object-cover border-4 border-gray-300 shadow"
                                  />
                                  <div className="mt-2 text-sm font-semibold text-gray-800 text-center line-clamp-2">
                                    {second.full_name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {second.pin_count} pin
                                  </div>
                                </div>
                                <div className="mt-3 h-28 w-full bg-gray-200 rounded-xl flex items-end justify-center relative">
                                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-300 text-gray-700 text-xs font-bold px-3 py-1 rounded-full">
                                    #2
                                  </div>
                                  <div className="w-full text-center text-xs text-gray-600 pb-2">
                                    Runner Up
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          {/* Rank 1 */}
                          <div className="flex flex-col items-center justify-end">
                            {first && (
                              <div
                                onClick={() => handleCardClick(first)}
                                className="cursor-pointer w-full max-w-[240px]"
                              >
                                <div className="flex flex-col items-center">
                                  <img
                                    src={first.avatar_url || "/logo-bps.png"}
                                    alt={first.full_name}
                                    className="w-24 h-24 rounded-full object-cover border-4 border-yellow-400 shadow"
                                  />
                                  <div className="mt-2 text-base font-bold text-gray-900 text-center line-clamp-2">
                                    {first.full_name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {first.pin_count} pin
                                  </div>
                                </div>
                                <div className="mt-3 h-36 w-full bg-yellow-200 rounded-xl flex items-end justify-center relative">
                                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                                    #1
                                  </div>
                                  <div className="w-full text-center text-xs text-yellow-800 pb-2">
                                    Champion
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          {/* Rank 3 */}
                          <div className="flex flex-col items-center justify-end">
                            {third && (
                              <div
                                onClick={() => handleCardClick(third)}
                                className="cursor-pointer w-full max-w-[220px]"
                              >
                                <div className="flex flex-col items-center">
                                  <img
                                    src={third.avatar_url || "/logo-bps.png"}
                                    alt={third.full_name}
                                    className="w-20 h-20 rounded-full object-cover border-4 border-amber-600 shadow"
                                  />
                                  <div className="mt-2 text-sm font-semibold text-gray-800 text-center line-clamp-2">
                                    {third.full_name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {third.pin_count} pin
                                  </div>
                                </div>
                                <div className="mt-3 h-24 w-full bg-amber-200 rounded-xl flex items-end justify-center relative">
                                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
                                    #3
                                  </div>
                                  <div className="w-full text-center text-xs text-amber-800 pb-2">
                                    Third
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Rank 4-5 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[fourth, fifth].filter(Boolean).map((u, idx) => (
                            <div
                              key={`top5-${(u as any).user_id}`}
                              onClick={() => handleCardClick(u as any)}
                              className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between hover:shadow-md transition cursor-pointer"
                            >
                              <div className="flex items-center space-x-3">
                                <img
                                  src={(u as any).avatar_url || "/logo-bps.png"}
                                  alt={(u as any).full_name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                                <div>
                                  <div className="font-semibold text-gray-900 line-clamp-1">
                                    {(u as any).full_name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {(u as any).pin_count} pin
                                  </div>
                                </div>
                              </div>
                              <div className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                                #{idx + 4}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Full ranking list below */}
                        <div className="mt-8 bg-white rounded-2xl border border-gray-100">
                          <div className="p-4 font-semibold text-gray-800">
                            Daftar Peringkat Lengkap
                          </div>
                          <div className="divide-y">
                            {monthlyRanking.map((u, idx) => (
                              <div
                                key={`full-${u.user_id}`}
                                className="flex items-center justify-between p-4"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-700 text-sm font-bold">
                                    #{idx + 1}
                                  </div>
                                  <img
                                    src={u.avatar_url || "/logo-bps.png"}
                                    alt={u.full_name}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {u.full_name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {u.pin_count} pin
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleCardClick(u)}
                                  className="text-sm px-3 py-1 rounded-lg border hover:bg-gray-50"
                                >
                                  Detail
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Pin History */}
          {activeTab === "history" && (
            <div>
              <PinHistory
                onAfterCancel={async (newPinsRemaining) => {
                  if (typeof newPinsRemaining === "number") {
                    setPinsRemaining(newPinsRemaining);
                  }
                  await loadData();
                }}
              />
            </div>
          )}
        </motion.div>
      </div>

      {/* Pin Detail Modal */}
      {selectedUser && (
        <PinDetailModal
          isOpen={isModalOpen}
          onClose={closeModal}
          user={selectedUser}
          periodType="monthly"
          periodInfo={{
            month: (selectedMonth ??
              activePinPeriod?.month ??
              currentMonth) as number,
            year: (selectedYear ??
              activePinPeriod?.year ??
              currentYear) as number,
          }}
        />
      )}
    </DashboardLayout>
  );
}

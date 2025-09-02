"use client";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PinService, PinRanking } from "@/lib/pin-service";
import { PinPeriodService } from "@/lib/pin-period-service";
import { motion } from "framer-motion";
import { Award, Pin, Calendar } from "lucide-react";

export default function PinsFullResultsPage() {
  const [monthlyRanking, setMonthlyRanking] = useState<PinRanking[]>([]);
  const [activePinPeriod, setActivePinPeriod] = useState<any | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const currentMonth = PinService.getCurrentMonth();
  const currentYear = PinService.getCurrentYear();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const pinPeriod = await PinPeriodService.getActive();
        setActivePinPeriod(pinPeriod);
        const targetMonth = (selectedMonth ??
          pinPeriod?.month ??
          currentMonth) as number;
        const targetYear = (selectedYear ??
          pinPeriod?.year ??
          currentYear) as number;
        const ranking = await PinService.getMonthlyRankingAllUsers(
          targetMonth,
          targetYear
        );
        setMonthlyRanking(ranking);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [selectedMonth, selectedYear]);

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

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Employee of the Month - Peringkat Lengkap
                </h1>
                <p className="text-gray-600">
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
                value={(selectedMonth ?? activePinPeriod?.month ?? "") as any}
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
                {Array.from({ length: 6 }, (_, i) => currentYear - 4 + i).map(
                  (y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  )
                )}
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
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
          </div>
        ) : monthlyRanking.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100">
            <Pin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-500 mb-2">
              Tidak ada riwayat pada bulan ini
            </h3>
            <p className="text-gray-400">
              {getMonthName(
                (selectedMonth ??
                  activePinPeriod?.month ??
                  currentMonth) as number
              )}{" "}
              {(selectedYear ?? activePinPeriod?.year ?? currentYear) as number}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 divide-y">
            {monthlyRanking.map((u, idx) => (
              <div
                key={u.user_id}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

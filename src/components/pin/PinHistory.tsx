// src/components/pin/PinHistory.tsx
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pin, Calendar, User, Clock, XCircle } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { PinService } from "@/lib/pin-service";
import { useStore } from "@/store/useStore";

interface PinHistoryItem {
  id: string;
  receiver: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  created_at: string;
  week_number: number;
  year: number;
}

interface PinHistoryProps {
  onAfterCancel?: () => void;
}

export function PinHistory({ onAfterCancel }: PinHistoryProps) {
  const [pinHistory, setPinHistory] = useState<PinHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const { user } = useStore();

  useEffect(() => {
    if (user?.id) {
      loadPinHistory();
    }
  }, [user?.id, selectedMonth, selectedYear]);

  const loadPinHistory = async () => {
    try {
      setIsLoading(true);
      const history = await PinService.getPinHistory(
        user!.id,
        selectedMonth || undefined,
        selectedYear || undefined
      );
      setPinHistory(history);
    } catch (error) {
      console.error("Error loading pin history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (pinId: string) => {
    if (!user?.id) return;
    if (!confirm("Batalkan pin ini?")) return;
    try {
      setIsCancelling(pinId);
      await PinService.cancelPin(pinId, user.id);
      await loadPinHistory();
      onAfterCancel && onAfterCancel();
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Gagal membatalkan pin");
    } finally {
      setIsCancelling(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMonthLabel = (month: number, year: number) => {
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
    return `${months[month - 1]}, ${year}`;
  };

  const getCurrentMonth = () => PinService.getCurrentMonth();
  const getCurrentYear = () => PinService.getCurrentYear();

  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const yearOptions = Array.from(
    { length: 5 },
    (_, i) => getCurrentYear() - 2 + i
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl">
          <Pin className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Riwayat Pin</h3>
          <p className="text-gray-600">Pin yang telah Anda berikan</p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select
            value={selectedMonth || ""}
            onChange={(e) =>
              setSelectedMonth(e.target.value ? Number(e.target.value) : null)
            }
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Semua Bulan</option>
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {getMonthLabel(m, getCurrentYear()).split(",")[0]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select
            value={selectedYear || ""}
            onChange={(e) =>
              setSelectedYear(e.target.value ? Number(e.target.value) : null)
            }
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Semua Tahun</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setSelectedMonth(null);
            setSelectedYear(null);
          }}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Reset Filter
        </button>
      </div>

      {/* Current Period Info */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
        <div className="flex items-center space-x-3">
          <Clock className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-sm text-blue-800">
              Periode saat ini:{" "}
              <span className="font-semibold">
                {getMonthLabel(getCurrentMonth(), getCurrentYear())}
              </span>
            </p>
            <p className="text-xs text-blue-600">
              Pilih bulan dan tahun untuk memfilter riwayat pin
            </p>
          </div>
        </div>
      </div>

      {/* Pin History List */}
      {pinHistory.length === 0 ? (
        <div className="text-center py-12">
          <Pin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-500 mb-2">
            Belum ada pin yang diberikan
          </h4>
          <p className="text-gray-400">
            {selectedMonth || selectedYear
              ? "Tidak ada pin yang diberikan pada periode yang dipilih"
              : "Mulai berikan pin kepada rekan kerja Anda pada hari Jumat"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {pinHistory.map((pin, index) => (
              <motion.div
                key={`pin-${pin.id}-${index}`} // Gunakan kombinasi ID dan index
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                {/* Receiver Avatar */}
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                  {pin.receiver?.avatar_url ? (
                    <img
                      src={pin.receiver.avatar_url}
                      alt={pin.receiver?.full_name || "Pengguna"}
                      className="w-full h-full rounded-xl object-cover"
                    />
                  ) : (
                    getInitials(pin.receiver?.full_name || "Tidak diketahui")
                  )}
                </div>

                {/* Pin Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Pin className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-600 font-medium">
                      Pin diberikan kepada
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900">
                    {pin.receiver?.full_name || "Pengguna tidak ditemukan"}
                  </h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>
                      {getMonthLabel(
                        (pin as any).month ||
                          new Date(pin.created_at).getMonth() + 1,
                        pin.year
                      )}
                    </span>
                    <span>•</span>
                    <span>{formatDate(pin.created_at)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCancel(pin.id)}
                    disabled={isCancelling === pin.id}
                    className="px-3 py-2 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 flex items-center space-x-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>
                      {isCancelling === pin.id ? "Membatalkan..." : "Batal"}
                    </span>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

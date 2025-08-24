// src/components/pin/PinDetailModal.tsx
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Pin, Users, Calendar, Award, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface PinDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    user_id: string;
    full_name: string;
    avatar_url?: string;
    pin_count: number;
    rank: number;
  };
  periodType: "weekly" | "monthly";
  periodInfo: {
    weekNumber?: number;
    year: number;
    month?: number;
  };
}

interface PinGiver {
  giver_id: string;
  giver_name: string;
  giver_avatar?: string | null;
  created_at: string;
}

export function PinDetailModal({
  isOpen,
  onClose,
  user,
  periodType,
  periodInfo,
}: PinDetailModalProps) {
  const [pinGivers, setPinGivers] = useState<PinGiver[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user.user_id) {
      loadPinGivers();
    }
  }, [isOpen, user.user_id]);

  const loadPinGivers = async () => {
    try {
      setIsLoading(true);

      // Debug: log query parameters
      console.log("🔍 Loading pin givers for:", {
        receiver_id: user.user_id,
        periodType,
        periodInfo,
      });

      // Query untuk mendapatkan pin berdasarkan receiver_id
      const { data: pins, error: pinsError } = await supabase
        .from("employee_pins")
        .select("giver_id, receiver_id, week_number, year, month, created_at")
        .eq("receiver_id", user.user_id);

      console.log("🔍 All pins for receiver:", { pins, pinsError });

      if (pinsError) {
        console.error("Error fetching pins:", pinsError);
        return;
      }

      if (!pins || pins.length === 0) {
        console.log("🔍 No pins found for receiver");
        setPinGivers([]);
        return;
      }

      // Filter berdasarkan period
      let filteredPins = pins;
      if (periodType === "weekly") {
        console.log("🔍 Filtering for weekly:", {
          weekNumber: periodInfo.weekNumber,
          year: periodInfo.year,
        });
        console.log(
          "🔍 Available pins week numbers:",
          pins.map((p) => ({ week: p.week_number, year: p.year }))
        );

        filteredPins = pins.filter(
          (pin) =>
            pin.week_number === periodInfo.weekNumber &&
            pin.year === periodInfo.year
        );
        console.log("🔍 Filtered weekly pins:", filteredPins);
      } else if (periodType === "monthly") {
        console.log("🔍 Filtering for monthly:", {
          month: periodInfo.month,
          year: periodInfo.year,
        });
        filteredPins = pins.filter(
          (pin) =>
            pin.month === periodInfo.month && pin.year === periodInfo.year
        );
        console.log("🔍 Filtered monthly pins:", filteredPins);
      }

      console.log("🔍 Final filtered pins:", filteredPins);

      if (filteredPins.length === 0) {
        console.log("🔍 No pins found for the specified period");
        setPinGivers([]);
        return;
      }

      // Ambil data giver untuk setiap pin
      const givers = [];
      for (const pin of filteredPins) {
        const { data: giverProfile, error: giverError } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .eq("id", pin.giver_id)
          .single();

        if (giverError) {
          console.error(
            `Error fetching giver profile for ${pin.giver_id}:`,
            giverError
          );
          continue;
        }

        givers.push({
          giver_id: pin.giver_id,
          giver_name: giverProfile?.full_name || "Unknown",
          giver_avatar: giverProfile?.avatar_url,
          created_at: pin.created_at,
        });
      }

      // Debug: log processed givers
      console.log("🔍 Processed givers:", givers);

      setPinGivers(givers);
    } catch (error) {
      console.error("Error loading pin givers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
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

  const getPeriodTitle = () => {
    if (periodType === "weekly") {
      return `Minggu ${periodInfo.weekNumber}, ${periodInfo.year}`;
    } else {
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
      return `${months[(periodInfo.month || 1) - 1]} ${periodInfo.year}`;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="absolute -top-3 -left-3 w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
          1st
        </div>
      );
    } else if (rank === 2) {
      return (
        <div className="absolute -top-3 -left-3 w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
          2nd
        </div>
      );
    } else if (rank === 3) {
      return (
        <div className="absolute -top-3 -left-3 w-12 h-12 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
          3rd
        </div>
      );
    }
    return null;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name}
                        className="w-full h-full rounded-2xl object-cover"
                      />
                    ) : (
                      getInitials(user.full_name)
                    )}
                  </div>
                  {getRankBadge(user.rank)}
                </div>

                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{user.full_name}</h2>
                  <div className="flex items-center space-x-4 text-blue-100">
                    <div className="flex items-center space-x-2">
                      <Pin className="w-5 h-5" />
                      <span className="font-semibold">
                        {user.pin_count} pin
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Award className="w-5 h-5" />
                      <span className="font-semibold">Rank #{user.rank}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Period Info */}
            <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
              <div className="flex items-center justify-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  {periodType === "weekly" ? (
                    <Calendar className="w-5 h-5 text-white" />
                  ) : (
                    <Star className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-gray-800">
                    {periodType === "weekly"
                      ? "Peringkat Mingguan"
                      : "Peringkat Bulanan"}
                  </h3>
                  <p className="text-gray-600 text-sm">{getPeriodTitle()}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>Yang Memberikan Pin</span>
                </h4>

                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Memuat data...</p>
                  </div>
                ) : pinGivers.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-2xl">
                    <Pin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Belum ada data pin</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pinGivers.map((giver, index) => (
                      <motion.div
                        key={`giver-${giver.giver_id}-${index}`} // Gunakan kombinasi ID dan index
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center space-x-4 p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-shadow"
                      >
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold">
                          {giver.giver_avatar ? (
                            <img
                              src={giver.giver_avatar}
                              alt={giver.giver_name}
                              className="w-full h-full rounded-xl object-cover"
                            />
                          ) : (
                            getInitials(giver.giver_name)
                          )}
                        </div>

                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900">
                            {giver.giver_name}
                          </h5>
                          <p className="text-sm text-gray-500">
                            {formatDate(giver.created_at)}
                          </p>
                        </div>

                        <div className="p-2 bg-red-100 rounded-full">
                          <Pin className="w-4 h-4 text-red-600" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Total {user.pin_count} pin diterima dari {pinGivers.length}{" "}
                  orang
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

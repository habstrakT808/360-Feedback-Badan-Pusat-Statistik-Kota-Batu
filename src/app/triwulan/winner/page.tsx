// src/app/triwulan/winner/page.tsx
"use client";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TriwulanPeriodService } from "@/lib/triwulan-period-service";
import { TriwulanService } from "@/lib/triwulan-service";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import {
  Trophy,
  Crown,
  Award,
  Star,
  Sparkles,
  Medal,
  RefreshCcw,
} from "lucide-react";
import Link from "next/link";

export default function TriwulanWinnerPage() {
  const [activePeriod, setActivePeriod] = useState<any | null>(null);
  const [winner, setWinner] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<
    Array<{
      candidate_id: string;
      total_score: number;
      num_raters: number;
      score_percent: number;
    }>
  >([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({});
  const [votingStatus, setVotingStatus] = useState<{
    requiredCount: number;
    completedCount: number;
  } | null>(null);
  // Leaderboard is always visible on this page

  useEffect(() => {
    (async () => {
      try {
        const p = await TriwulanPeriodService.getActive();
        setActivePeriod(p);
        if (!p) return;

        // Live leaderboard and profiles
        const sc = await TriwulanService.getScores(p.id);
        const sortedInit = (sc || []).slice().sort((a: any, b: any) => {
          const diff = (b.total_score || 0) - (a.total_score || 0);
          if (diff !== 0) return diff;
          return (b.num_raters || 0) - (a.num_raters || 0);
        });
        setScores(sortedInit);
        const ids = (sc || []).map((s) => s.candidate_id);
        if (ids.length) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("id, full_name, department, position, avatar_url")
            .in("id", ids);
          if (profs) {
            const map: Record<string, any> = {};
            profs.forEach((pp) => (map[pp.id] = pp));
            setProfilesMap(map);
          }
        }

        const w = await TriwulanService.getWinner(p.id);
        setWinner(w);

        if (w?.winner_id) {
          const { data } = await supabase
            .from("profiles")
            .select("id, full_name, department, position, avatar_url")
            .eq("id", w.winner_id)
            .single();
          if (data) setProfile(data);
        }

        const vs = await TriwulanService.getRatingsCompletionStatus(p.id);
        setVotingStatus({
          requiredCount: vs.requiredCount,
          completedCount: vs.completedCount,
        });
      } catch (error) {
        console.error("Error loading winner data:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!activePeriod) return;
    const timer = setInterval(async () => {
      const sc = await TriwulanService.getScores(activePeriod.id);
      const sorted = (sc || []).slice().sort((a: any, b: any) => {
        const diff = (b.total_score || 0) - (a.total_score || 0);
        if (diff !== 0) return diff;
        return (b.num_raters || 0) - (a.num_raters || 0);
      });
      setScores(sorted);
      const ids = (sc || []).map((s) => s.candidate_id);
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, department, position, avatar_url")
          .in("id", ids);
        if (profs) {
          const map: Record<string, any> = {};
          profs.forEach((pp) => (map[pp.id] = pp));
          setProfilesMap(map);
        }
      }
      const vs = await TriwulanService.getRatingsCompletionStatus(
        activePeriod.id
      );
      setVotingStatus({
        requiredCount: vs.requiredCount,
        completedCount: vs.completedCount,
      });
    }, 15000);
    return () => clearInterval(timer);
  }, [activePeriod]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  Pegawai Terbaik Triwulan
                </h1>
                {activePeriod && (
                  <p className="text-gray-600 text-lg">
                    Periode {activePeriod.year} - Q{activePeriod.quarter}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/triwulan?edit=1"
                className="px-4 py-2 rounded-xl border hover:bg-gray-50 inline-flex items-center gap-2"
              >
                Kembali ke Memilih Kandidat
              </Link>
              <button
                onClick={async () => {
                  if (!activePeriod) return;
                  const sc = await TriwulanService.getScores(activePeriod.id);
                  const sorted = (sc || []).slice().sort((a: any, b: any) => {
                    const diff = (b.total_score || 0) - (a.total_score || 0);
                    if (diff !== 0) return diff;
                    return (b.num_raters || 0) - (a.num_raters || 0);
                  });
                  setScores(sorted);
                }}
                className="px-3 py-2 rounded-xl border hover:bg-gray-50 inline-flex items-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" /> Refresh
              </button>
            </div>
          </div>
          {activePeriod && (
            <div className="flex items-center gap-3">
              <span className="px-4 py-2 text-sm font-medium rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
                <Trophy className="w-4 h-4 inline mr-2" />
                Triwulan
              </span>
              <span className="px-4 py-2 text-sm font-medium rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                Q{activePeriod.quarter}
              </span>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Peringkat Sementara</h2>
              {votingStatus && (
                <span className="text-sm text-gray-600">
                  Selesai: {votingStatus.completedCount} /{" "}
                  {votingStatus.requiredCount}
                </span>
              )}
            </div>
            <div className="divide-y">
              {scores.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  Belum ada data penilaian.
                </div>
              )}
              {scores.map((s, idx) => {
                const p = profilesMap[s.candidate_id];
                return (
                  <div
                    key={s.candidate_id}
                    className="flex items-center gap-4 py-3"
                  >
                    <div className="w-10 text-center">
                      {idx < 3 ? (
                        <Medal
                          className={`w-6 h-6 ${
                            idx === 0
                              ? "text-yellow-500"
                              : idx === 1
                              ? "text-gray-400"
                              : "text-amber-600"
                          }`}
                        />
                      ) : (
                        <span className="text-sm font-semibold">
                          #{idx + 1}
                        </span>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                      {p?.avatar_url ? (
                        <img
                          src={p.avatar_url}
                          alt={p?.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {p?.full_name || s.candidate_id}
                      </div>
                      <div className="text-xs text-gray-600">
                        {p?.position || p?.department || ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        Skor {Math.round((s.total_score || 0) * 100) / 100}
                      </div>
                      <div className="text-xs text-gray-500">
                        Penilai: {s.num_raters}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {winner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50 rounded-3xl opacity-50" />

            <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Header with gradient background */}
              <div className="relative h-48 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute inset-0">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 0.6, scale: 1 }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      className="absolute"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }}
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                    </motion.div>
                  ))}
                </div>

                {/* Crown icon */}
                <motion.div
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  className="absolute top-6 left-1/2 transform -translate-x-1/2"
                >
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                </motion.div>
              </div>

              {/* Profile section */}
              <div className="px-8 pb-8 -mt-20 relative z-10">
                <div className="flex flex-col items-center">
                  {/* Profile picture */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    className="relative"
                  >
                    <div className="w-32 h-32 rounded-full overflow-hidden ring-6 ring-white shadow-2xl bg-gradient-to-r from-gray-200 to-gray-300">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-yellow-400 to-orange-500">
                          <span className="text-white font-bold text-4xl">
                            {profile?.full_name?.charAt(0) ||
                              winner.winner_id?.charAt(0) ||
                              "?"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Winner badge */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 0.8,
                        type: "spring",
                        stiffness: 300,
                      }}
                      className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white"
                    >
                      <Trophy className="w-6 h-6 text-white" />
                    </motion.div>
                  </motion.div>

                  {/* Winner info */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-center mt-6"
                  >
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      {profile?.full_name || winner.winner_id}
                    </h2>

                    {(profile?.position || profile?.department) && (
                      <div className="text-gray-600 mb-4">
                        {profile?.position && (
                          <span className="font-medium">
                            {profile.position}
                          </span>
                        )}
                        {profile?.position && profile?.department && " • "}
                        {profile?.department}
                      </div>
                    )}

                    {typeof winner.total_score === "number" && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          delay: 0.9,
                          type: "spring",
                          stiffness: 200,
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-2 border-yellow-200"
                      >
                        <Star className="w-5 h-5" />
                        <span className="font-bold">
                          Skor Total: {winner.total_score}
                        </span>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Congratulations message */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="mt-8 text-center max-w-2xl"
                  >
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        🎉 Selamat! 🎉
                      </h3>
                      <p className="text-gray-700">
                        Anda telah terpilih sebagai{" "}
                        <strong>Pegawai Terbaik Triwulan</strong> berdasarkan
                        penilaian dari rekan kerja. Prestasi dan dedikasi Anda
                        sangat diapresiasi oleh seluruh tim.
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}

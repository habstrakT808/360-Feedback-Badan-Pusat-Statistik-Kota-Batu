// src/app/triwulan/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loading } from "@/components/ui/Loading";
import { TriwulanPeriodService } from "@/lib/triwulan-period-service";
import { TriwulanService } from "@/lib/triwulan-service";
import { supabase } from "@/lib/supabase";
import { RolesService } from "@/lib/roles-service";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  Users,
  Clock,
  CheckCircle,
  Star,
  Trophy,
  ArrowRight,
} from "lucide-react";

export default function TriwulanAssessmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState<any | null>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [step, setStep] = useState<
    "select" | "waiting" | "shortlist" | "rate" | "done"
  >("select");
  const [selected, setSelected] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, number[]>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [votingInfo, setVotingInfo] = useState<{
    requiredCount: number;
    completedCount: number;
  } | null>(null);
  const [shortlisted, setShortlisted] = useState<string[]>([]);
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(
    null
  );

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const uid = data.user?.id || null;
        setUserId(uid);

        const p = await TriwulanPeriodService.getActive();
        if (!p) {
          toast("Belum ada Triwulan aktif");
          setLoading(false);
          return;
        }
        setActivePeriod(p);

        let cand = await TriwulanService.listCandidates(p.id);
        // Exclude admin and supervisor from candidates
        const { adminIds, supervisorIds } = await RolesService.getRoleUserIds();
        const restricted = new Set([
          ...(adminIds || []),
          ...(supervisorIds || []),
        ]);
        cand = (cand || []).filter((c: any) => !restricted.has(c.user_id));
        setCandidates(cand);

        // If user has voted before, prefill selection and step
        if (uid) {
          try {
            const [prevSelected, done] = await Promise.all([
              TriwulanService.getUserVotes(p.id, uid),
              TriwulanService.hasCompletedVote(p.id, uid),
            ]);
            if (prevSelected && prevSelected.length > 0) {
              setSelected(prevSelected);
            }
          } catch {}
        }

        // Determine initial phase
        if ((cand || []).length > 5) {
          const info = await TriwulanService.getVotingStatus(p.id);
          setVotingInfo({
            requiredCount: info.requiredCount,
            completedCount: info.completedCount,
          });
          if (info.completedCount >= info.requiredCount) {
            const top = await TriwulanService.getTopCandidates(p.id, 5);
            setShortlisted(top.map((t) => t.candidate_id));
            setStep("shortlist");
          } else {
            setStep("waiting");
          }
        } else {
          // If 5 or fewer candidates, automatically set shortlist and go to rating
          setShortlisted((cand || []).map((c: any) => c.user_id));
          // Check if user has already completed ratings for all candidates
          if (uid) {
            try {
              const existingMap = await TriwulanService.getUserRatingsMap(p.id, uid);
              const allRated = (cand || []).every((c: any) => {
                const ratings = existingMap[c.user_id];
                return Array.isArray(ratings) && ratings.length === 13 && ratings.every(Boolean);
              });
              if (allRated) {
                setStep("shortlist");
              } else {
                setStep("rate");
                setActiveCandidateId((cand || []).map((c: any) => c.user_id)[0] || null);
              }
            } catch {
              // If error checking ratings, default to rating step
              setStep("rate");
              setActiveCandidateId((cand || []).map((c: any) => c.user_id)[0] || null);
            }
          } else {
            setStep("rate");
            setActiveCandidateId((cand || []).map((c: any) => c.user_id)[0] || null);
          }
        }

        // Load profile names for display
        const ids = cand.map((c) => c.user_id);
        if (ids.length) {
          const { data: profs, error } = await supabase
            .from("profiles")
            .select("id, full_name, department, position, avatar_url")
            .in("id", ids);
          if (!error && profs) {
            const map: Record<string, any> = {};
            profs.forEach((p) => (map[p.id] = p));
            setProfiles(map);
          }
          // Prefetch existing ratings to derive status badges
          if (uid) {
            try {
              const existingMap = await TriwulanService.getUserRatingsMap(
                p.id,
                uid
              );
              if (existingMap && Object.keys(existingMap).length > 0) {
                setRatings((prev) => ({ ...existingMap, ...prev }));
              }
            } catch {}
          }
        }
      } catch (e: any) {
        toast.error(e.message || "Gagal memuat Triwulan");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Auto-redirect to winner page when user has completed all assessments
  useEffect(() => {
    if (!activePeriod || loading) return;
    // Skip auto-redirect when editing via explicit query flag
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("edit") === "1") return;
    }
    const targetIds = (
      shortlisted.length > 0 ? shortlisted : candidates.map((c) => c.user_id)
    ) as string[];
    if (targetIds.length === 0) return;
    const isComplete = targetIds.every((cid) => {
      const arr = ratings[cid];
      return Array.isArray(arr) && arr.length === 13 && arr.every(Boolean);
    });
    if (isComplete) {
      router.replace("/triwulan/winner");
    }
  }, [activePeriod, loading, shortlisted, candidates, ratings, router]);

  const maxSelect = useMemo(
    () => (candidates.length > 5 ? 5 : candidates.length),
    [candidates.length]
  );

  const beginRating = async () => {
    if (!activePeriod || !userId) return;
    if (selected.length !== (candidates.length > 5 ? 5 : selected.length)) {
      if (candidates.length > 5 && selected.length !== 5) {
        toast.error("Pilih tepat 5 kandidat");
        return;
      }
    }
    if (candidates.length > 5) {
      try {
        await TriwulanService.submitVotes(activePeriod.id, userId, selected);
        await TriwulanService.markVoteCompleted(activePeriod.id, userId);
        const info = await TriwulanService.getVotingStatus(activePeriod.id);
        setVotingInfo({
          requiredCount: info.requiredCount,
          completedCount: info.completedCount,
        });
        if (info.completedCount >= info.requiredCount) {
          const top = await TriwulanService.getTopCandidates(
            activePeriod.id,
            5
          );
          setShortlisted(top.map((t) => t.candidate_id));
          setStep("shortlist");
        } else {
          setStep("waiting");
        }
      } catch (e: any) {
        toast.error(e.message || "Gagal menyimpan pilihan");
      }
      return;
    }
    const ids = candidates.map((c) => c.user_id);
    setShortlisted(ids);
    setActiveCandidateId(ids[0] || null);
    setStep("rate");
  };

  const submitCurrentRating = async (goNext: boolean) => {
    if (!activePeriod || !userId || !activeCandidateId) return;
    try {
      const scores = ratings[activeCandidateId];
      if (!scores || scores.length !== 13 || scores.some((s) => !s)) {
        toast.error("Lengkapi semua rating untuk kandidat ini");
        return;
      }
      await TriwulanService.submitRatings({
        periodId: activePeriod.id,
        raterId: userId,
        candidateId: activeCandidateId,
        scores: ratings[activeCandidateId] as any,
      });
      if (!goNext) {
        toast.success("Penilaian tersimpan");
        setStep("shortlist");
        return;
      }
      const ids =
        shortlisted.length > 0 ? shortlisted : candidates.map((c) => c.user_id);
      const idx = ids.indexOf(activeCandidateId);
      const nextId = ids[idx + 1];
      if (nextId) {
        setActiveCandidateId(nextId);
        toast.success("Tersimpan. Lanjut kandidat berikutnya");
      } else {
        setStep("shortlist");
        toast.success("Terima kasih, semua penilaian tersimpan");
      }
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan penilaian");
    }
  };

  useEffect(() => {
    if (step !== "rate") return;
    const ids =
      shortlisted.length > 0 ? shortlisted : candidates.map((c) => c.user_id);
    if (!activeCandidateId && ids.length > 0) {
      setActiveCandidateId(ids[0]);
    }
    // Prefill when activeCandidateId changes
    (async () => {
      if (!activePeriod || !userId || !activeCandidateId) return;
      try {
        const existing = await TriwulanService.getUserRating(
          activePeriod.id,
          userId,
          activeCandidateId
        );
        if (existing && existing.length === 13) {
          setRatings((prev) => ({
            ...prev,
            [activeCandidateId]: existing as any,
          }));
        }
      } catch {}
    })();
  }, [step, shortlisted, candidates, activeCandidateId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-20">
          <Loading size="lg" text="Memuat Triwulan..." />
        </div>
      </DashboardLayout>
    );
  }

  if (!activePeriod) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Belum Ada Triwulan Aktif
            </h3>
            <p className="text-gray-600">
              Saat ini belum ada periode triwulan yang aktif. Silakan cek
              kembali nanti.
            </p>
          </motion.div>
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
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                Penilaian Pegawai Terbaik Triwulan
              </h1>
              <p className="text-gray-600 text-lg">
                Periode {activePeriod.year} - Q{activePeriod.quarter}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 text-sm font-medium rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
              <Award className="w-4 h-4 inline mr-2" />
              Triwulan
            </span>
            <span className="px-4 py-2 text-sm font-medium rounded-full bg-orange-100 text-orange-700 border border-orange-200">
              Q{activePeriod.quarter}
            </span>
          </div>
        </motion.div>
        <div className="mt-4 mb-4 flex justify-end">
          <Link
            href="/triwulan/winner"
            className="px-4 py-2 rounded-xl border hover:bg-gray-50 transition inline-flex items-center gap-2"
          >
            Lihat Peringkat & Pemenang
          </Link>
        </div>

        {/* Info message for 5 or fewer candidates */}
        {candidates.length <= 5 && step === "select" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200"
          >
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-800 font-medium">
                  Kandidat {candidates.length} orang - Langsung ke Penilaian
                </p>
                <p className="text-xs text-blue-600">
                  Karena jumlah kandidat {candidates.length} orang (≤ 5), Anda akan langsung menilai semua kandidat tanpa perlu memilih.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {step === "select" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Pilih Kandidat
                </h2>
                <p className="text-gray-600">
                  {candidates.length > 5
                    ? `Terdapat ${candidates.length} kandidat. Silakan pilih tepat 5 orang terbaik.`
                    : `Kandidat ${candidates.length} orang. Anda akan menilai semuanya.`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    Dipilih {selected.length}
                  </span>
                </div>
                {candidates.length > 5 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full border border-indigo-200">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-700">
                      Sisa {Math.max(0, 5 - selected.length)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {candidates.map((c, index) => {
                const p = profiles[c.user_id];
                const isSelected = selected.includes(c.user_id);
                const canSelectMore = selected.length < maxSelect || isSelected;
                return (
                  <motion.button
                    key={c.user_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      if (!canSelectMore) return;
                      setSelected((prev) =>
                        prev.includes(c.user_id)
                          ? prev.filter((x) => x !== c.user_id)
                          : [...prev, c.user_id]
                      );
                    }}
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative flex items-center gap-4 p-6 border-2 rounded-2xl text-left transition-all duration-300 ${
                      isSelected
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 shadow-lg"
                        : "bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-md"
                    }`}
                  >
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-3 -right-3 inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </motion.span>
                    )}
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-r from-gray-200 to-gray-300 ring-2 ring-white shadow-md">
                      {p?.avatar_url ? (
                        <img
                          src={p.avatar_url}
                          alt={p.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-400 to-indigo-500">
                          <span className="text-white font-bold text-lg">
                            {p?.full_name?.charAt(0) || "?"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-lg">
                        {p?.full_name || c.user_id}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {p?.position && (
                          <span className="font-medium">{p.position}</span>
                        )}
                        {p?.position && p?.department && " • "}
                        {p?.department}
                      </div>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        isSelected
                          ? "bg-blue-100 text-blue-700 border-blue-200"
                          : selected.length < maxSelect
                          ? "bg-gray-50 text-gray-700 border-gray-200 hover:bg-blue-50 hover:text-blue-700"
                          : "bg-gray-100 text-gray-400 border-gray-200"
                      }`}
                    >
                      {isSelected
                        ? "Dipilih"
                        : selected.length < maxSelect
                        ? "Pilih"
                        : "Penuh"}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <div className="flex justify-end mt-8">
              <motion.button
                onClick={beginRating}
                disabled={candidates.length > 5 && selected.length !== 5}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  candidates.length > 5 && selected.length !== 5
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl"
                }`}
              >
                {candidates.length > 5 && selected.length !== 5
                  ? `Pilih ${Math.max(0, 5 - selected.length)} lagi`
                  : "Lanjut ke Penilaian"}
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === "waiting" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Menunggu Semua Pemilih
              </h2>
              <p className="text-gray-600">
                Kita menunggu semua user menyelesaikan pemilihan 5 kandidat
                terbaik.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">
                  Progress Voting
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {votingInfo?.completedCount ?? 0} /{" "}
                  {votingInfo?.requiredCount ?? 0}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        ((votingInfo?.completedCount || 0) /
                          Math.max(1, votingInfo?.requiredCount || 1)) *
                          100
                      )
                    )}%`,
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <motion.button
                onClick={() => setStep("select")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 transition-all font-medium"
              >
                Ubah Pilihan
              </motion.button>
              <motion.button
                onClick={async () => {
                  if (!activePeriod) return;
                  const info = await TriwulanService.getVotingStatus(
                    activePeriod.id
                  );
                  setVotingInfo({
                    requiredCount: info.requiredCount,
                    completedCount: info.completedCount,
                  });
                  if (info.completedCount >= info.requiredCount) {
                    const top = await TriwulanService.getTopCandidates(
                      activePeriod.id,
                      5
                    );
                    setShortlisted(top.map((t) => t.candidate_id));
                    setStep("shortlist");
                  }
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition-all font-medium shadow-lg"
              >
                Refresh Status
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === "shortlist" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Kandidat Terpilih
              </h2>
              <p className="text-gray-600">
                5 kandidat dengan suara terbanyak. Pilih salah satu untuk mulai
                menilai.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shortlisted.map((cid, idx) => {
                const p = profiles[cid];
                const rank = idx + 1;
                const rankColors = [
                  "from-yellow-400 to-amber-500 text-yellow-900",
                  "from-gray-300 to-gray-400 text-gray-800",
                  "from-orange-300 to-amber-400 text-amber-900",
                  "from-blue-200 to-blue-300 text-blue-900",
                  "from-indigo-200 to-indigo-300 text-indigo-900",
                ];
                // derive status: none => Mulai Menilai, some but not all => Draft, all => Selesai
                const scores = ratings[cid] || [];
                const filled = scores.filter(Boolean).length;
                const status: "none" | "draft" | "done" =
                  filled === 0 ? "none" : filled < 13 ? "draft" : "done";
                return (
                  <motion.button
                    key={cid}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={async () => {
                      setActiveCandidateId(cid);
                      // Prefill existing rating if any
                      if (activePeriod && userId) {
                        try {
                          const existing = await TriwulanService.getUserRating(
                            activePeriod.id,
                            userId,
                            cid
                          );
                          if (existing && existing.length === 13) {
                            setRatings((prev) => ({
                              ...prev,
                              [cid]: existing as any,
                            }));
                          }
                        } catch {}
                      }
                      setStep("rate");
                    }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative flex items-center gap-4 p-6 border-2 border-gray-200 rounded-2xl text-left bg-white hover:bg-gray-50 hover:shadow-lg transition-all duration-300"
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: idx * 0.1 + 0.2 }}
                      className={`absolute -top-3 -left-3 inline-flex items-center justify-center h-8 min-w-8 px-2 rounded-full text-sm font-bold bg-gradient-to-r shadow-lg ${rankColors[idx]}`}
                    >
                      #{rank}
                    </motion.span>
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-r from-gray-200 to-gray-300 ring-4 ring-white shadow-lg">
                      {p?.avatar_url ? (
                        <img
                          src={p.avatar_url}
                          alt={p?.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-400 to-indigo-500">
                          <span className="text-white font-bold text-lg">
                            {p?.full_name?.charAt(0) || "?"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-lg">
                        {p?.full_name || cid}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {p?.position && (
                          <span className="font-medium">{p.position}</span>
                        )}
                        {p?.position && p?.department && " • "}
                        {p?.department}
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${
                        status === "done"
                          ? "bg-green-50 border-green-200 text-green-700"
                          : status === "draft"
                          ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                          : "bg-blue-50 border-blue-200 text-blue-700"
                      }`}
                    >
                      {status === "done" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : status === "draft" ? (
                        <Clock className="w-4 h-4" />
                      ) : (
                        <Star className="w-4 h-4" />
                      )}
                      {status === "done"
                        ? "Selesai"
                        : status === "draft"
                        ? "Draft"
                        : "Mulai Menilai"}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === "rate" && activeCandidateId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100"
          >
            {(() => {
              const p = profiles[activeCandidateId];
              const criteria = [
                "Memiliki gagasan dan ide-ide kreatif dalam pelaksanaan pekerjaan",
                "Selalu tuntas dan bahkan melebihi target",
                "Memiliki Komitmen menaati ketentuan masuk kerja dan jam kerja",
                "Dapat diteladani dalam melaksanakan tanggung jawab dan tugasnya",
                "Menjadi inspirasi bagi rekan sejawat",
                "Amanah dalam pelaksanaan tugasnya",
                "Kemampuan bekerja sama dalam tim, responsif dan solutif",
                "Melakukan inovasi yang bermanfaat",
                "Memiliki prestasi berdampak positif bagi instansi",
                "Membangun lingkungan kerja yang kondusif",
                "Menunjukkan loyalitas terhadap Organisasi",
                "Mampu menyesuaikan diri (adaptif)",
                "Mampu memberikan pengaruh positif",
              ];
              const filled = (ratings[activeCandidateId] || []).filter(
                Boolean
              ).length;
              const percent = Math.round((filled / 13) * 100);

              return (
                <>
                  <div className="flex items-center gap-6 mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-r from-gray-200 to-gray-300 ring-4 ring-white shadow-lg">
                      {p?.avatar_url ? (
                        <img
                          src={p.avatar_url}
                          alt={p?.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-400 to-indigo-500">
                          <span className="text-white font-bold text-2xl">
                            {p?.full_name?.charAt(0) || "?"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-2xl text-gray-900 mb-1">
                        {p?.full_name || activeCandidateId}
                      </div>
                      <div className="text-gray-600 mb-3">
                        {p?.position && (
                          <span className="font-medium">{p.position}</span>
                        )}
                        {p?.position && p?.department && " • "}
                        {p?.department}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 rounded-full bg-gray-200 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-900 min-w-max">
                          {percent === 0
                            ? "Mulai Menilai"
                            : percent === 100
                            ? "Selesai"
                            : "Draft"}{" "}
                          • {percent}% lengkap
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {criteria.map((label, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100"
                      >
                        <div className="text-gray-800 flex-1">
                          <span className="font-semibold text-blue-600 mr-2">
                            {idx + 1}.
                          </span>
                          {label}
                        </div>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <motion.button
                              key={n}
                              onClick={() =>
                                setRatings((prev) => {
                                  const arr =
                                    prev[activeCandidateId!]?.slice() ||
                                    Array(13).fill(0);
                                  arr[idx] = n;
                                  return { ...prev, [activeCandidateId!]: arr };
                                })
                              }
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className={`w-10 h-10 rounded-full border-2 text-sm font-bold transition-all ${
                                ratings[activeCandidateId]?.[idx] === n
                                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-500 shadow-lg"
                                  : "bg-white hover:bg-blue-50 border-gray-300 hover:border-blue-300 text-gray-700"
                              }`}
                            >
                              {n}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                    <motion.button
                      onClick={() => setStep("shortlist")}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 transition-all font-medium"
                    >
                      Kembali ke Daftar
                    </motion.button>
                    {(() => {
                      const ids =
                        shortlisted.length > 0
                          ? shortlisted
                          : candidates.map((c) => c.user_id);
                      const idx = ids.indexOf(activeCandidateId);
                      const isLast = idx === ids.length - 1;
                      return (
                        <div className="flex gap-3">
                          {!isLast && (
                            <motion.button
                              onClick={() => submitCurrentRating(true)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all font-medium"
                            >
                              Kirim & Lanjut
                              <ArrowRight className="w-4 h-4" />
                            </motion.button>
                          )}
                          <motion.button
                            onClick={() => submitCurrentRating(false)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all font-medium"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {isLast
                              ? "Kirim & Selesai"
                              : "Selesai Kandidat Ini"}
                          </motion.button>
                        </div>
                      );
                    })()}
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}

        {step === "done" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-12 shadow-xl border border-gray-100 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Terima Kasih!
            </h2>
            <p className="text-gray-600 text-lg">
              Penilaian Triwulan Anda telah berhasil tersimpan. Kontribusi Anda
              sangat berarti untuk menentukan pegawai terbaik.
            </p>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}

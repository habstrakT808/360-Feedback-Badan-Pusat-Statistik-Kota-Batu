// src/app/my-results/page.tsx (REPLACE COMPLETE FILE)
"use client";
import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { ResultsService } from "@/lib/results-service";
import { AspectCard } from "@/components/results/AspectCard";
import { Loading } from "@/components/ui/Loading";
import { toast } from "react-hot-toast";
import { ASSESSMENT_ASPECTS } from "@/lib/assessment-data";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useUserRole } from "@/hooks/useUserRole";
import {
  Trophy,
  AlertCircle,
  Award,
  Users,
  Calendar,
  TrendingUp,
  Star,
  UserCheck,
} from "lucide-react";

// Aspect names mapping
const ASPECT_NAMES: Record<string, string> = {
  kolaboratif: "Kolaboratif",
  adaptif: "Adaptif",
  loyal: "Loyal",
  harmonis: "Harmonis",
  kompeten: "Kompeten",
  akuntabel: "Akuntabel",
  berorientasi_pelayanan: "Berorientasi Pelayanan",
};

export default function MyResultsPage() {
  const { user } = useStore();
  const router = useRouter();
  const { isAdmin } = useUserRole();
  const [results, setResults] = useState<any[]>([]);
  const [weightedData, setWeightedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isAdmin) {
      router.replace("/admin");
    }
  }, [isAdmin, router]);

  useEffect(() => {
    if (user) {
      loadResults();
    }
  }, [user]);

  const loadResults = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      const [rawData, weightedResults] = await Promise.all([
        ResultsService.getMyResults(user.id),
        ResultsService.getWeightedResults(user.id),
      ]);

      setResults(rawData || []);
      setWeightedData(weightedResults);
    } catch (error: any) {
      console.error("Error loading results:", error);
      toast.error("Gagal memuat hasil penilaian: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getRatingText = (rating: number) => {
    if (rating >= 90)
      return {
        text: "Istimewa",
        color: "text-green-600",
        bg: "bg-green-100",
      };
    if (rating >= 80)
      return { text: "Sangat Baik", color: "text-blue-600", bg: "bg-blue-100" };
    if (rating >= 70)
      return { text: "Baik", color: "text-indigo-600", bg: "bg-indigo-100" };
    if (rating >= 60)
      return {
        text: "Cukup Baik",
        color: "text-yellow-600",
        bg: "bg-yellow-100",
      };
    if (rating >= 50)
      return { text: "Cukup", color: "text-orange-600", bg: "bg-orange-100" };
    return { text: "Perlu Perbaikan", color: "text-red-600", bg: "bg-red-100" };
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-20">
          <Loading size="lg" text="Memuat hasil penilaian..." />
        </div>
      </DashboardLayout>
    );
  }

  // Build comment index per-aspect from raw feedback results
  // Deduplicate by assessor per aspect to avoid repeated comments per indicator
  const commentsByAspect: Record<
    string,
    Array<{ comment: string; isSupervisor: boolean }>
  > = (() => {
    const seenKeys = new Set<string>();
    return (results || []).reduce((acc: any, item: any) => {
      if (!item || !item.comment) return acc;
      const aspectId = item.aspect as string;
      const assessorId =
        item?.assignment?.assessor_id || item.assessor_id || "unknown";
      const dedupeKey = `${assessorId}:${aspectId}`;
      if (seenKeys.has(dedupeKey)) return acc;
      seenKeys.add(dedupeKey);

      if (!acc[aspectId]) acc[aspectId] = [];
      acc[aspectId].push({
        comment: String(item.comment).trim(),
        isSupervisor: !!item.isSupervisorFeedback,
      });
      return acc;
    }, {} as Record<string, Array<{ comment: string; isSupervisor: boolean }>>);
  })();

  const toggleAspect = (aspectId: string) => {
    setExpanded((prev) => ({ ...prev, [aspectId]: !prev[aspectId] }));
  };

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
            <div className="p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Hasil Penilaian Saya
              </h1>
              <p className="text-gray-600 text-lg">
                Hasil penilaian 360° dengan bobot supervisor 60% + rekan kerja
                40%
              </p>
            </div>
          </div>

          {weightedData?.periodInfo && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>
                Periode:{" "}
                {new Date(0, weightedData.periodInfo.month - 1).toLocaleString(
                  "id-ID",
                  { month: "long" }
                )}{" "}
                {weightedData.periodInfo.year}
              </span>
            </div>
          )}
        </motion.div>

        {results.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-32 h-32 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <Trophy className="w-16 h-16 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Belum Ada Hasil Penilaian
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
              Anda belum menerima feedback dari supervisor atau rekan kerja.
              Hasil akan muncul setelah ada data penilaian yang tersedia.
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <AlertCircle className="w-5 h-5" />
              <span>Hubungi admin jika Anda merasa ini adalah kesalahan</span>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Overall Summary with Weighted Scores */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-3xl p-8 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>

              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">
                      Skor Final (Berbobot)
                    </h2>
                    <p className="text-white/80">
                      Supervisor 60% + Rekan Kerja 40%
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-bold mb-2">
                      {weightedData?.overallScore
                        ? weightedData.overallScore.toFixed(1)
                        : "0.0"}
                    </div>
                    <div className="text-white/80">dari 100</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div className="text-2xl font-bold">
                      {weightedData?.supervisorFeedbackCount || 0}
                    </div>
                    <div className="text-white/80 text-sm">
                      Feedback Supervisor
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="text-2xl font-bold">
                      {weightedData?.peerFeedbackCount || 0}
                    </div>
                    <div className="text-white/80 text-sm">
                      Feedback Rekan Kerja
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Award className="w-6 h-6" />
                    </div>
                    <div className="text-2xl font-bold">
                      {weightedData?.aspectResults?.length || 0}
                    </div>
                    <div className="text-white/80 text-sm">Aspek Dinilai</div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-medium">
                      {weightedData?.overallScore
                        ? getRatingText(weightedData.overallScore).text
                        : "N/A"}
                    </div>
                    <div className="text-white/80 text-xs mt-1">Kategori</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Assessment Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    Penilaian Supervisor
                  </h3>
                  <div
                    className={`p-2 rounded-full ${
                      weightedData?.hasSupervisorAssessment
                        ? "bg-green-100"
                        : "bg-gray-100"
                    }`}
                  >
                    <UserCheck
                      className={`w-5 h-5 ${
                        weightedData?.hasSupervisorAssessment
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    />
                  </div>
                </div>
                <div
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                    weightedData?.hasSupervisorAssessment
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {weightedData?.hasSupervisorAssessment
                    ? "Sudah Dinilai (60% bobot)"
                    : "Belum Dinilai"}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    Penilaian Rekan Kerja
                  </h3>
                  <div
                    className={`p-2 rounded-full ${
                      weightedData?.hasPeerAssessment
                        ? "bg-blue-100"
                        : "bg-gray-100"
                    }`}
                  >
                    <Users
                      className={`w-5 h-5 ${
                        weightedData?.hasPeerAssessment
                          ? "text-blue-600"
                          : "text-gray-400"
                      }`}
                    />
                  </div>
                </div>
                <div
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                    weightedData?.hasPeerAssessment
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {weightedData?.hasPeerAssessment
                    ? "Ada Feedback (40% bobot)"
                    : "Belum Ada Feedback"}
                </div>
              </motion.div>
            </div>

            {/* Weighted Aspect Results */}
            {weightedData?.aspectResults &&
              weightedData.aspectResults.length > 0 && (
                <div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-6"
                  >
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Hasil per Aspek (Berbobot)
                    </h2>
                    <p className="text-gray-600">
                      Skor final per aspek menggunakan bobot supervisor 60% +
                      rekan kerja 40%
                    </p>
                  </motion.div>

                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                              Aspek
                            </th>
                            <th className="px-6 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                              Skor Supervisor
                            </th>
                            <th className="px-6 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                              Skor Rekan Kerja
                            </th>
                            <th className="px-6 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                              Skor Final
                            </th>
                            <th className="px-6 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                              Total Feedback
                            </th>
                            <th className="px-6 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                              Komentar
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {weightedData.aspectResults.map(
                            (aspect: any, index: number) => {
                              const aspectName =
                                ASPECT_NAMES[aspect.aspect] || aspect.aspect;
                              const aspectComments =
                                commentsByAspect[aspect.aspect] || [];

                              return (
                                <Fragment key={aspect.aspect}>
                                  <motion.tr
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + index * 0.05 }}
                                    className="hover:bg-gray-50 transition-colors"
                                  >
                                    <td className="px-6 py-4">
                                      <div className="text-sm font-medium text-gray-900">
                                        {aspectName}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <div
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                          aspect.supervisorAverage
                                            ? `${
                                                getRatingText(
                                                  aspect.supervisorAverage
                                                ).bg
                                              } ${
                                                getRatingText(
                                                  aspect.supervisorAverage
                                                ).color
                                              }`
                                            : "bg-gray-100 text-gray-400"
                                        }`}
                                      >
                                        {aspect.supervisorAverage
                                          ? aspect.supervisorAverage.toFixed(1)
                                          : "N/A"}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <div
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                          aspect.peerAverage
                                            ? `${
                                                getRatingText(
                                                  aspect.peerAverage
                                                ).bg
                                              } ${
                                                getRatingText(
                                                  aspect.peerAverage
                                                ).color
                                              }`
                                            : "bg-gray-100 text-gray-400"
                                        }`}
                                      >
                                        {aspect.peerAverage
                                          ? aspect.peerAverage.toFixed(1)
                                          : "N/A"}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <div
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                          aspect.finalScore
                                            ? `${
                                                getRatingText(aspect.finalScore)
                                                  .bg
                                              } ${
                                                getRatingText(aspect.finalScore)
                                                  .color
                                              }`
                                            : "bg-gray-100 text-gray-400"
                                        }`}
                                      >
                                        <Star className="w-4 h-4 mr-1" />
                                        {aspect.finalScore
                                          ? aspect.finalScore.toFixed(1)
                                          : "N/A"}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm text-gray-900">
                                      {aspect.totalFeedback}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <button
                                        onClick={() =>
                                          toggleAspect(aspect.aspect)
                                        }
                                        className="px-3 py-1 text-sm rounded-full border border-gray-300 hover:bg-gray-50"
                                      >
                                        {expanded[aspect.aspect]
                                          ? "Sembunyikan"
                                          : "Lihat"}
                                      </button>
                                    </td>
                                  </motion.tr>

                                  <AnimatePresence>
                                    {expanded[aspect.aspect] && (
                                      <motion.tr
                                        key={`${aspect.aspect}-comments`}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="bg-gray-50"
                                      >
                                        <td colSpan={6} className="px-6 py-4">
                                          {aspectComments.length === 0 ? (
                                            <div className="text-sm text-gray-500">
                                              Belum ada komentar untuk aspek
                                              ini.
                                            </div>
                                          ) : (
                                            <div className="space-y-3">
                                              {aspectComments.map((c, idx) => (
                                                <motion.div
                                                  key={idx}
                                                  initial={{ opacity: 0, y: 6 }}
                                                  animate={{ opacity: 1, y: 0 }}
                                                  transition={{
                                                    duration: 0.2,
                                                    delay: idx * 0.03,
                                                  }}
                                                  className="p-3 bg-white rounded-lg border border-gray-200"
                                                >
                                                  <div className="flex items-center justify-between">
                                                    <div className="text-sm text-gray-900">
                                                      {c.comment}
                                                    </div>
                                                    <div
                                                      className={`text-xs font-medium ${
                                                        c.isSupervisor
                                                          ? "text-purple-600"
                                                          : "text-blue-600"
                                                      }`}
                                                    >
                                                      {c.isSupervisor
                                                        ? "Supervisor"
                                                        : "Rekan Kerja"}
                                                    </div>
                                                  </div>
                                                </motion.div>
                                              ))}
                                            </div>
                                          )}
                                        </td>
                                      </motion.tr>
                                    )}
                                  </AnimatePresence>
                                </Fragment>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

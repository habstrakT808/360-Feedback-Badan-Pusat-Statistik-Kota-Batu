// src/app/team/user/[userId]/page.tsx (NEW FILE)
"use client";
import { useState, useEffect, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useUserRole } from "@/hooks/useUserRole";
import { SupervisorService } from "@/lib/supervisor-service";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loading } from "@/components/ui/Loading";
import { toast } from "react-hot-toast";
import { ASSESSMENT_ASPECTS } from "@/lib/assessment-data";
import {
  ArrowLeft,
  User,
  Star,
  TrendingUp,
  Award,
  BarChart3,
  Users,
  MessageSquare,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isSupervisor } = useUserRole();
  const userId = params.userId as string;

  const [userDetail, setUserDetail] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (userId) {
      loadUserDetail();
    }
  }, [userId]);

  const toggleAspect = (aspect: string) => {
    setExpanded((prev) => ({
      ...prev,
      [aspect]: !prev[aspect],
    }));
  };

  const loadUserDetail = async () => {
    try {
      setIsLoading(true);
      const data = await SupervisorService.getUserDetailWithResults(userId);
      if (!data) {
        toast.error("Data pengguna tidak ditemukan");
        router.push("/team");
        return;
      }
      setUserDetail(data);
    } catch (error: any) {
      console.error("Error loading user detail:", error);
      toast.error("Gagal memuat detail pengguna: " + error.message);
      router.push("/team");
    } finally {
      setIsLoading(false);
    }
  };

  const getRatingColor = (rating: number | null) => {
    if (!rating) return "text-gray-400";
    if (rating >= 80) return "text-green-600";
    if (rating >= 60) return "text-blue-600";
    if (rating >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getRatingBg = (rating: number | null) => {
    if (!rating) return "bg-gray-100";
    if (rating >= 80) return "bg-green-100";
    if (rating >= 60) return "bg-blue-100";
    if (rating >= 40) return "bg-yellow-100";
    return "bg-red-100";
  };

  const getRatingText = (rating: number | null) => {
    if (!rating) return "Belum dinilai";
    if (rating >= 90) return "Istimewa";
    if (rating >= 80) return "Sangat Baik";
    if (rating >= 70) return "Baik";
    if (rating >= 60) return "Cukup Baik";
    if (rating >= 50) return "Cukup";
    return "Perlu Perbaikan";
  };

  const getAspectName = (aspectId: string) => {
    const aspect = ASSESSMENT_ASPECTS.find((a) => a.id === aspectId);
    return aspect?.name || aspectId;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-20">
          <Loading size="lg" text="Memuat detail pengguna..." />
        </div>
      </DashboardLayout>
    );
  }

  if (!userDetail) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Data Tidak Ditemukan
            </h3>
            <p className="text-gray-600 mb-6">
              Detail pengguna tidak ditemukan atau belum ada data penilaian.
            </p>
            <button
              onClick={() => router.push("/team")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Kembali ke Tim
            </button>
          </div>
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
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => router.push("/team")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Detail Karyawan
              </h1>
              <p className="text-gray-600">
                Hasil penilaian dan informasi lengkap
              </p>
            </div>
          </div>
        </motion.div>

        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                {userDetail.user.avatar_url ? (
                  <img
                    src={userDetail.user.avatar_url}
                    alt={userDetail.user.full_name || userDetail.user.email}
                    className="w-20 h-20 object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-3xl">
                    {userDetail.user.full_name?.charAt(0) ||
                      userDetail.user.email?.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {userDetail.user.full_name || userDetail.user.email}
                </h2>
                {userDetail.user.position && (
                  <p className="text-gray-600 text-lg">
                    {userDetail.user.position}
                  </p>
                )}
                {userDetail.user.department && (
                  <p className="text-gray-500">{userDetail.user.department}</p>
                )}
                <p className="text-gray-400 text-sm mt-1">
                  {userDetail.user.email}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              {isSupervisor && !userDetail.hasSupervisorAssessment && (
                <button
                  onClick={() =>
                    router.push(`/assessment/supervisor/${userId}`)
                  }
                  className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Beri Penilaian</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Overall Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Performa Keseluruhan</h3>
              <p className="text-white/80">
                Skor berdasarkan bobot: Supervisor 60% + Rekan Kerja 40%
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold mb-2">
                {userDetail.finalScore
                  ? userDetail.finalScore.toFixed(1)
                  : "N/A"}
              </div>
              <div className="text-white/80">dari 100</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold">
                {userDetail.supervisorAverage
                  ? userDetail.supervisorAverage.toFixed(1)
                  : "N/A"}
              </div>
              <div className="text-white/80 text-sm">Skor Supervisor</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold">
                {userDetail.peerAverage
                  ? userDetail.peerAverage.toFixed(1)
                  : "N/A"}
              </div>
              <div className="text-white/80 text-sm">Skor Rekan Kerja</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold">
                {userDetail.totalFeedback}
              </div>
              <div className="text-white/80 text-sm">Total Feedback</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Award className="w-6 h-6" />
              </div>
              <div className="text-sm font-medium">
                {getRatingText(userDetail.finalScore)}
              </div>
              <div className="text-white/80 text-xs mt-1">Kategori</div>
            </div>
          </div>
        </motion.div>

        {/* Assessment Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Status Penilaian Supervisor
              </h3>
              <div
                className={`p-2 rounded-full ${
                  userDetail.hasSupervisorAssessment
                    ? "bg-green-100"
                    : "bg-gray-100"
                }`}
              >
                <Star
                  className={`w-5 h-5 ${
                    userDetail.hasSupervisorAssessment
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                />
              </div>
            </div>
            <div
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                userDetail.hasSupervisorAssessment
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {userDetail.hasSupervisorAssessment
                ? "Sudah Dinilai"
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
                Status Penilaian Rekan Kerja
              </h3>
              <div
                className={`p-2 rounded-full ${
                  userDetail.hasPeerAssessment ? "bg-blue-100" : "bg-gray-100"
                }`}
              >
                <Users
                  className={`w-5 h-5 ${
                    userDetail.hasPeerAssessment
                      ? "text-blue-600"
                      : "text-gray-400"
                  }`}
                />
              </div>
            </div>
            <div
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                userDetail.hasPeerAssessment
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {userDetail.hasPeerAssessment
                ? "Ada Feedback"
                : "Belum Ada Feedback"}
            </div>
          </motion.div>
        </div>

        {/* Aspect Results */}
        {userDetail.aspectResults && userDetail.aspectResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">
                Hasil per Aspek
              </h3>
              <p className="text-gray-600 mt-1">
                Breakdown penilaian berdasarkan aspek kompetensi
              </p>
            </div>
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
                  {userDetail.aspectResults.map(
                    (aspect: any, index: number) => (
                      <Fragment key={aspect.aspect}>
                        <motion.tr
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 + index * 0.05 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {getAspectName(aspect.aspect)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRatingBg(
                                aspect.supervisorAverage
                              )} ${getRatingColor(aspect.supervisorAverage)}`}
                            >
                              {aspect.supervisorAverage
                                ? aspect.supervisorAverage.toFixed(1)
                                : "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRatingBg(
                                aspect.peerAverage
                              )} ${getRatingColor(aspect.peerAverage)}`}
                            >
                              {aspect.peerAverage
                                ? aspect.peerAverage.toFixed(1)
                                : "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRatingBg(
                                aspect.finalScore
                              )} ${getRatingColor(aspect.finalScore)}`}
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
                              onClick={() => toggleAspect(aspect.aspect)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              {expanded[aspect.aspect] ? (
                                <ChevronUp className="w-5 h-5 text-gray-600" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-600" />
                              )}
                            </button>
                          </td>
                        </motion.tr>
                        <AnimatePresence>
                          {expanded[aspect.aspect] && (
                            <motion.tr
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ delay: 0.1 }}
                              className="bg-gray-50"
                            >
                              <td colSpan={6} className="px-6 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="text-lg font-semibold mb-2 text-gray-900">
                                      Feedback Supervisor
                                    </h4>
                                    {aspect.supervisorComments &&
                                    aspect.supervisorComments.length > 0 ? (
                                      <div className="space-y-2">
                                        {aspect.supervisorComments.map(
                                          (comment: any, idx: number) => (
                                            <div
                                              key={idx}
                                              className="bg-white p-3 rounded-lg border border-gray-200"
                                            >
                                              <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-gray-700">
                                                  {comment.assessor}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                  Skor: {comment.rating}
                                                </span>
                                              </div>
                                              <p className="text-gray-800 text-sm">
                                                {comment.comment}
                                              </p>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-gray-500 italic">
                                        Tidak ada feedback supervisor
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="text-lg font-semibold mb-2 text-gray-900">
                                      Feedback Rekan Kerja
                                    </h4>
                                    {aspect.peerComments &&
                                    aspect.peerComments.length > 0 ? (
                                      <div className="space-y-2">
                                        {aspect.peerComments.map(
                                          (comment: any, idx: number) => (
                                            <div
                                              key={idx}
                                              className="bg-white p-3 rounded-lg border border-gray-200"
                                            >
                                              <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-gray-700">
                                                  {comment.assessor}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                  Skor: {comment.rating}
                                                </span>
                                              </div>
                                              <p className="text-gray-800 text-sm">
                                                {comment.comment}
                                              </p>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-gray-500 italic">
                                        Tidak ada feedback rekan kerja
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </Fragment>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* No Data Message */}
        {(!userDetail.aspectResults ||
          userDetail.aspectResults.length === 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center py-12"
          >
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Belum Ada Data Penilaian
            </h3>
            <p className="text-gray-600">
              Karyawan ini belum menerima penilaian dari supervisor atau rekan
              kerja.
            </p>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}

// src/app/team/page.tsx (REPLACE COMPLETE FILE)
"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUserRole } from "@/hooks/useUserRole";
import { useStore } from "@/store/useStore";
import { TeamService } from "@/lib/team-service";
import { SupervisorService } from "@/lib/supervisor-service";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loading } from "@/components/ui/Loading";
import { toast } from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import {
  Users,
  TrendingUp,
  Award,
  Eye,
  Star,
  BarChart3,
  UserCheck,
  Filter,
  Globe,
  Lock,
} from "lucide-react";

// Component for regular users (existing functionality)
function RegularTeamView() {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      setIsLoading(true);
      const [members, performance] = await Promise.all([
        TeamService.getAllTeamMembers(),
        TeamService.getTeamPerformance(),
      ]);
      setTeamMembers(members);
      setTeamPerformance(performance);
    } catch (error: any) {
      console.error("Error loading team data:", error);
      toast.error("Gagal memuat data tim: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProfile = (member: any) => {
    if (member.allow_public_view) {
      window.location.href = `/team/user/${member.id}`;
    } else {
      toast.error("Profil ini bersifat privat");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loading size="lg" text="Memuat data tim..." />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center space-x-4 mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Tim
            </h1>
            <p className="text-gray-600 text-lg">
              Lihat performa dan informasi anggota tim
            </p>
          </div>
        </div>
      </motion.div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className={`bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer ${
              member.allow_public_view ? "hover:border-blue-300" : ""
            }`}
            onClick={() => handleViewProfile(member)}
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.full_name || member.email}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-xl">
                    {member.full_name?.charAt(0) || member.email?.charAt(0)}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {member.full_name || member.email}
              </h3>
              {member.position && (
                <p className="text-gray-600 mb-1">{member.position}</p>
              )}
              {member.department && (
                <p className="text-gray-500 text-sm">{member.department}</p>
              )}

              {/* Public Profile Indicator */}
              <div className="mt-4">
                {member.allow_public_view ? (
                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    <Globe className="w-4 h-4" />
                    <span>Profil Publik</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                    <Lock className="w-4 h-4" />
                    <span>Profil Privat</span>
                  </div>
                )}
              </div>

              {/* Click to view message */}
              {member.allow_public_view && (
                <p className="text-blue-600 text-sm mt-2 font-medium">
                  Klik untuk lihat profil lengkap →
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Component for supervisor view
function SupervisorTeamView() {
  const [userResults, setUserResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [periods, setPeriods] = useState<any[]>([]);

  useEffect(() => {
    loadPeriods();
  }, []);

  useEffect(() => {
    loadUserResults();
  }, [selectedPeriod]);

  const loadPeriods = async () => {
    try {
      const { data, error } = await supabase
        .from("assessment_periods")
        .select("*")
        .order("year", { ascending: false })
        .order("month", { ascending: false });

      if (error) throw error;
      setPeriods(data || []);

      // Set current active period as default
      const activePeriod = data?.find((p: any) => p.is_active);
      if (activePeriod) {
        setSelectedPeriod(activePeriod.id);
      }
    } catch (error: any) {
      console.error("Error loading periods:", error);
      toast.error("Gagal memuat periode: " + error.message);
    }
  };

  const loadUserResults = async () => {
    try {
      setIsLoading(true);
      const data = await SupervisorService.getAllUsersWithResults(
        selectedPeriod || undefined
      );
      setUserResults(data);
    } catch (error: any) {
      console.error("Error loading user results:", error);
      toast.error("Gagal memuat hasil penilaian: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // removed sample peer assessments utilities

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
    return months[month - 1] || month.toString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loading size="lg" text="Memuat hasil penilaian..." />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl">
              <UserCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Dashboard Supervisor
              </h1>
              <p className="text-gray-600 text-lg">
                Lihat hasil penilaian semua karyawan dengan bobot supervisor 60%
              </p>
            </div>
          </div>

          {/* Period Filter */}
          <div className="flex items-center space-x-3">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Semua Periode</option>
              {periods.map((period, index) => (
                <option key={period.id || `period-${index}`} value={period.id}>
                  {getMonthName(period.month)} {period.year}
                  {period.is_active && " (Aktif)"}
                </option>
              ))}
            </select>

            {/* Sample generation removed */}
          </div>
        </div>
      </motion.div>

      {userResults.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Belum Ada Hasil Penilaian
          </h3>
          <p className="text-gray-600">
            Hasil penilaian akan muncul setelah ada data yang tersedia.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Karyawan
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {userResults.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Sudah Dinilai Supervisor
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {
                      userResults.filter((u) => u.hasSupervisorAssessment)
                        .length
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Rata-rata Skor
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {userResults.length > 0
                      ? (
                          userResults.reduce(
                            (sum, u) => sum + (u.finalScore || 0),
                            0
                          ) / userResults.length
                        ).toFixed(1)
                      : "0.0"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Skor Tertinggi
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {userResults.length > 0
                      ? Math.max(
                          ...userResults.map((u) => u.finalScore || 0)
                        ).toFixed(1)
                      : "0.0"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* User Results Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Hasil Penilaian Karyawan
              </h2>
              <p className="text-gray-600 mt-1">
                Skor final menggunakan bobot: Supervisor 60% + Rekan Kerja 40%
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Karyawan
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
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userResults.map((result, index) => (
                    <motion.tr
                      key={result.user.id || `user-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            {result.user.avatar_url ? (
                              <img
                                src={result.user.avatar_url}
                                alt={result.user.full_name || result.user.email}
                                className="w-10 h-10 object-cover"
                              />
                            ) : (
                              <span className="text-white font-semibold text-sm">
                                {result.user.full_name?.charAt(0) ||
                                  result.user.email?.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {result.user.full_name || result.user.email}
                            </div>
                            {result.user.position && (
                              <div className="text-sm text-gray-500">
                                {result.user.position}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRatingBg(
                            result.supervisorAverage
                          )} ${getRatingColor(result.supervisorAverage)}`}
                        >
                          {result.supervisorAverage
                            ? result.supervisorAverage.toFixed(1)
                            : "Belum dinilai"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRatingBg(
                            result.peerAverage
                          )} ${getRatingColor(result.peerAverage)}`}
                        >
                          {result.peerAverage
                            ? result.peerAverage.toFixed(1)
                            : "Belum ada"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRatingBg(
                            result.finalScore
                          )} ${getRatingColor(result.finalScore)}`}
                        >
                          <Star className="w-4 h-4 mr-1" />
                          {result.finalScore
                            ? result.finalScore.toFixed(1)
                            : "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-900">
                        {result.totalFeedback}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() =>
                              (window.location.href = `/team/user/${result.user.id}`)
                            }
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Detail
                          </button>
                          {!result.hasSupervisorAssessment && (
                            <button
                              onClick={() =>
                                (window.location.href = `/assessment/supervisor/${result.user.id}`)
                              }
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                            >
                              <BarChart3 className="w-4 h-4 mr-1" />
                              Nilai
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeamPage() {
  const { user } = useStore();
  const { isSupervisor, isLoading } = useUserRole();

  if (isLoading || !user) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-20">
          <Loading size="lg" text="Memuat..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {isSupervisor ? <SupervisorTeamView /> : <RegularTeamView />}
    </DashboardLayout>
  );
}

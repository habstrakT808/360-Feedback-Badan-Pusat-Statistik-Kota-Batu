"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loading } from "@/components/ui/Loading";
import { TeamService } from "@/lib/team-service";
import { toast } from "react-hot-toast";
import { FloatingComments } from "@/components/team/FloatingComments";
import { useUserRole } from "@/hooks/useUserRole";
import {
  ArrowLeft,
  Star,
  TrendingUp,
  Award,
  Users,
  BarChart3,
  MapPin,
  Mail,
  Lock,
  Globe,
  CheckCircle,
  Activity,
  LineChart,
} from "lucide-react";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  position: string | null;
  department: string | null;
  avatar_url: string | null;
  allow_public_view: boolean;
  created_at: string;
}

interface PerformanceData {
  averageRating: number;
  totalFeedback: number;
  completedAssessments: number;
  pendingAssessments: number;
  periodProgress: number;
  recentScores: Array<{ period: string; score: number }>;
  strengths: string[];
  areasForImprovement: string[];
  totalEmployees: number;
  maxAssignments: number;
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const { isSupervisor, isLoading: roleLoading } = useUserRole();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const [comments, setComments] = useState<Array<{ id: string; text: string; created_at: string; author?: any }>>([]);

  // This state helps prevent race conditions when role loading completes
  // and isSupervisor changes from false to true

  useEffect(() => {
    if (userId && !roleLoading) {
      // Always retry if role loading is complete and we haven't loaded yet
      // or if we're a supervisor and previously got a private profile error
      if (!hasAttemptedLoad || (isSupervisor && error === "Profil ini bersifat privat")) {
        setHasAttemptedLoad(true);
        loadUserProfile();
      }
    }
  }, [userId, roleLoading, isSupervisor, hasAttemptedLoad, error]);

  // Additional effect to handle supervisor role changes
  useEffect(() => {
    if (userId && !roleLoading && isSupervisor && error === "Profil ini bersifat privat") {
      // Clear error and retry when supervisor role is confirmed
      setError(null);
      loadUserProfile();
    }
  }, [userId, roleLoading, isSupervisor, error]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);

      // Get user profile
      const profileResponse = await fetch(`/api/team/user/${userId}`);
      const json = await profileResponse.json();
      if (!profileResponse.ok) {
        throw new Error(json?.error || 'Failed to fetch user profile');
      }

      const fetchedProfile = json.profile as any;
      const allowPublic = !!fetchedProfile?.allow_public_view;

      // Deny only when profile private and current user is not supervisor
      if (!allowPublic && !isSupervisor) {
        setError("Profil ini bersifat privat");
        setIsLoading(false);
        return;
      }
      if (isSupervisor && !allowPublic) {
        setError(null);
      }

      setProfile({
        id: fetchedProfile.id,
        full_name: fetchedProfile.full_name,
        email: fetchedProfile.email,
        position: fetchedProfile.position,
        department: fetchedProfile.department,
        avatar_url: fetchedProfile.avatar_url,
        allow_public_view: allowPublic,
        created_at: fetchedProfile.created_at,
      });

      // Get performance data
      await loadPerformanceData(userId);
      await loadComments(userId);
         } catch (error: any) {
       setError(error.message || "Gagal memuat profil");
     } finally {
      setIsLoading(false);
    }
  };

  const loadPerformanceData = async (userId: string) => {
    try {
      setIsLoadingPerformance(true);
      const res = await fetch(`/api/team/performance?userId=${encodeURIComponent(userId)}`, { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json().catch(() => ({}))
        if (json?.performance) setPerformance(json.performance)
      }
    } catch (error: any) {
      toast.error(`Gagal memuat data performa: ${error.message}`);

      // Set default performance data on error
      const defaultPerformance = {
        averageRating: 0,
        totalFeedback: 0,
        totalEmployees: 0,
        maxAssignments: 0,
        completedAssessments: 0,
        pendingAssessments: 0,
        periodProgress: 0,
        recentScores: [{ period: "Periode", score: 0 }],
        strengths: [
          "Komunikasi yang efektif",
          "Kerja tim yang baik",
          "Inisiatif tinggi",
          "Problem solving",
          "Leadership",
          "Kreativitas",
        ],
        areasForImprovement: [
          "Manajemen waktu",
          "Presentasi publik",
          "Teknologi terbaru",
          "Analisis data",
        ],
      };
      setPerformance(defaultPerformance);
    } finally {
      setIsLoadingPerformance(false);
    }
  };

  const loadComments = async (uid: string) => {
    try {
      const res = await fetch(`/api/team/comments?userId=${encodeURIComponent(uid)}`, { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json().catch(() => ({}))
        setComments(json?.comments || [])
      }
    } catch (e) {
      // ignore errors, keep comments empty
    }
  }

  if (isLoading || roleLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loading size="lg" text="Memuat profil..." />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !profile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center bg-white rounded-2xl p-8 shadow-lg">
            <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Profil Tidak Tersedia
            </h2>
            <p className="text-gray-600 mb-4">
              {isSupervisor
                ? error || "Profil ini tidak ditemukan atau telah dihapus"
                : "Profil ini bersifat privat dan hanya dapat diakses oleh supervisor"}
            </p>
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Kembali
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: "overview", name: "Overview", icon: BarChart3 },
    { id: "performance", name: "Performa", icon: TrendingUp },
    { id: "strengths", name: "Komentar", icon: Award },
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="p-6">
            <button
              onClick={() => router.back()}
              className="mb-6 p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-white/20 border-2 border-white/30">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                    {profile.full_name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{profile.full_name}</h1>
                <div className="space-y-1 text-blue-100">
                  {profile.position && (
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4" />
                      <span>{profile.position}</span>
                    </div>
                  )}
                  {profile.department && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.department}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>{profile.email}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div
                  className={`flex items-center space-x-2 mb-2 ${
                    profile.allow_public_view
                      ? "text-green-300"
                      : "text-yellow-300"
                  }`}
                >
                  {profile.allow_public_view ? (
                    <Globe className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  <span className="text-sm">
                    {profile.allow_public_view
                      ? "Profil Publik"
                      : isSupervisor
                      ? "Profil Privat (Supervisor Access)"
                      : "Profil Privat"}
                  </span>
                </div>
                <div className="text-3xl font-bold">
                  {performance?.averageRating && performance.averageRating > 0
                    ? performance.averageRating.toFixed(1)
                    : "N/A"}
                </div>
                <div className="text-sm text-blue-100">Rating Rata-rata</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="p-6 -mt-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
              {
                icon: Star,
                label: "Rating",
                value: isLoadingPerformance ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : performance?.averageRating &&
                  performance.averageRating > 0 ? (
                  performance.averageRating.toFixed(1)
                ) : (
                  "N/A"
                ),
                color: "bg-yellow-500",
              },
              {
                icon: Users,
                label: "Feedback Diterima",
                value: isLoadingPerformance ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
                ) : (
                  `${performance?.totalFeedback || 0}/${
                    performance?.totalEmployees || 0
                  }`
                ),
                color: "bg-blue-500",
              },
              {
                icon: CheckCircle,
                label: "Penilaian Selesai",
                value: isLoadingPerformance ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
                ) : (
                  `${performance?.completedAssessments || 0}/${
                    performance?.maxAssignments || 0
                  }`
                ),
                color: "bg-green-500",
              },
              {
                icon: Activity,
                label: "Progress",
                value: isLoadingPerformance ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  `${
                    performance?.periodProgress
                      ? Math.round(performance.periodProgress)
                      : 0
                  }%`
                ),
                color: "bg-purple-500",
              },
            ].map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm border"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-3 ${stat.color} rounded-lg`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <div className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {/* Tabs */}
            <div className="border-b">
              <nav className="flex overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600 bg-blue-50"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <tab.icon className="w-4 h-4" />
                      <span>{tab.name}</span>
                    </div>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {isLoadingPerformance ? (
                <div className="flex items-center justify-center py-20">
                  <Loading size="lg" text="Memuat data performa..." />
                </div>
              ) : (
                <>
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Rating Overview */}
                        <div className="bg-blue-50 rounded-xl p-6 border overflow-hidden">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                            <Star className="w-5 h-5 text-blue-600" />
                            <span>Rating Overview</span>
                          </h3>
                          <div className="text-center">
                            <div className="text-4xl font-bold text-blue-600 mb-2">
                              {performance?.averageRating &&
                              performance.averageRating > 0
                                ? performance.averageRating.toFixed(1)
                                : "N/A"}
                            </div>
                            <div className="text-sm text-gray-600 mb-4">
                              dari 100 poin
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 relative">
                              <div
                                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(
                                    performance?.averageRating &&
                                      performance.averageRating > 0
                                      ? performance.averageRating
                                      : 0,
                                    100
                                  )}%`,
                                  maxWidth: "100%",
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Performance Chart */}
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                            <LineChart className="w-5 h-5 text-purple-600" />
                            <span>Performa Periode Ini</span>
                          </h3>
                          <div className="h-32 flex items-center justify-center relative overflow-hidden">
                            {performance?.recentScores &&
                            performance.recentScores.length > 0 ? (
                              <div className="text-center">
                                <div className="text-3xl font-bold text-purple-600 mb-2">
                                  {performance.recentScores[0].score &&
                                  performance.recentScores[0].score > 0
                                    ? performance.recentScores[0].score.toFixed(
                                        1
                                      )
                                    : "N/A"}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Rating {performance.recentScores[0].period}{" "}
                                  (0-100)
                                </div>
                              </div>
                            ) : (
                              <div className="text-center text-gray-500">
                                <div className="text-lg">Belum ada data</div>
                                <div className="text-sm">
                                  Periode ini belum dinilai
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Achievements section removed as requested */}
                    </div>
                  )}

                  {activeTab === "performance" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Metrik Detail */}
                        <div className="bg-blue-50 rounded-xl p-6 border">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                            <BarChart3 className="w-5 h-5 text-blue-600" />
                            <span>Metrik Detail</span>
                          </h3>
                          <div className="space-y-4">
                            {[
                              {
                                label: "Total Feedback Diterima",
                                value: performance?.totalFeedback || 0,
                                max: performance?.totalEmployees || 0,
                                color: "bg-blue-500",
                                suffix: `/${performance?.totalEmployees || 0}`,
                              },
                              {
                                label: "Penilaian Selesai",
                                value: performance?.completedAssessments || 0,
                                max: performance?.maxAssignments || 0,
                                color: "bg-green-500",
                                suffix: `/${performance?.maxAssignments || 0}`,
                              },
                              {
                                label: "Progress Periode Ini",
                                value: Math.round(
                                  performance?.periodProgress || 0
                                ),
                                max: 100,
                                color: "bg-purple-500",
                                suffix: "%",
                              },
                            ].map((metric, index) => (
                              <div
                                key={index}
                                className="bg-white rounded-lg p-4 border"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-gray-600">
                                    {metric.label}
                                  </span>
                                  <span className="text-lg font-bold text-gray-900">
                                    {metric.value}
                                    {metric.suffix || ""}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`${metric.color} h-2 rounded-full transition-all duration-500`}
                                    style={{
                                      width: `${Math.min(
                                        (metric.value / metric.max) * 100,
                                        100
                                      )}%`,
                                      maxWidth: "100%",
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Analisis Performa */}
                        <div className="bg-green-50 rounded-xl p-6 border">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                            <LineChart className="w-5 h-5 text-green-600" />
                            <span>Analisis Performa</span>
                          </h3>
                          <div className="h-48 flex items-center justify-center relative overflow-hidden">
                            {performance?.recentScores &&
                            performance.recentScores.length > 0 ? (
                              <div className="text-center">
                                <div className="text-4xl font-bold text-green-600 mb-2">
                                  {performance.recentScores[0].score &&
                                  performance.recentScores[0].score > 0
                                    ? performance.recentScores[0].score.toFixed(
                                        1
                                      )
                                    : "N/A"}
                                </div>
                                <div className="text-sm text-gray-600 mb-2">
                                  Rating {performance.recentScores[0].period}{" "}
                                  (0-100)
                                </div>
                                <div className="w-32 h-32 bg-gradient-to-t from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
                                  <div className="text-white text-2xl font-bold">
                                    {Math.round(
                                      performance.recentScores[0].score
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center text-gray-500">
                                <div className="text-lg">Belum ada data</div>
                                <div className="text-sm">
                                  Periode ini belum dinilai
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Insight section removed as requested */}
                    </div>
                  )}

                  {activeTab === "strengths" && (
                    <div className="space-y-4">
                      {comments.length === 0 ? (
                        <div className="text-center text-gray-500 py-12">Belum Ada Komentar</div>
                      ) : (
                        comments.map((c) => (
                          <div key={c.id} className="p-4 bg-gray-50 border rounded-lg">
                            <div className="flex items-center mb-2">
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 mr-3">
                                {c.author?.avatar_url ? (
                                  <img src={c.author.avatar_url} alt={c.author.full_name} className="w-full h-full object-cover" />
                                ) : null}
                              </div>
                              <div className="text-sm text-gray-700 font-medium">{c.author?.full_name || 'Anonim'}</div>
                              <div className="ml-auto text-xs text-gray-500">{new Date(c.created_at).toLocaleString('id-ID')}</div>
                            </div>
                            <div className="text-gray-800">{c.text}</div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

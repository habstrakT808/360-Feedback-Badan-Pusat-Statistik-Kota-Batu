// src/app/dashboard/page.tsx
"use client";
import { useState, useEffect } from "react";
import { motion, Variants, spring } from "framer-motion";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ExportButton } from "@/components/export/ExportButton";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { DashboardService, DashboardStats } from "@/lib/dashboard-service";
import { SmartNotificationServiceImproved } from "@/lib/smart-notification-service";
import { useStore } from "@/store/useStore";
import {
  Users,
  Calendar,
  TrendingUp,
  Award,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Star,
  Target,
  Zap,
  ArrowRight,
} from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const { user } = useStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    completedAssessments: 0,
    pendingAssessments: 0,
    currentPeriod: "Memuat...",
    myProgress: 0,
    averageRating: 0,
    myAssignments: [],
    currentPeriodData: null,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
      
      // Generate notifications only once per session
      const notificationsGenerated = sessionStorage.getItem(`notifications_${user.id}`)
      if (!notificationsGenerated) {
        SmartNotificationServiceImproved.generateForUser(user.id)
          .then(() => {
            sessionStorage.setItem(`notifications_${user.id}`, 'true')
          })
          .catch((error: any) => {
            console.error("Failed to generate notifications:", error);
          });
      }
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const [dashboardStats, activities] = await Promise.all([
        DashboardService.getDashboardStats(user.id),
        DashboardService.getMyRecentActivity(user.id),
      ]);

      setStats(dashboardStats);
      setRecentActivities(activities);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      // Set default stats if there's an error
      setStats({
        totalEmployees: 0,
        completedAssessments: 0,
        pendingAssessments: 0,
        currentPeriod: "Tidak ada periode aktif",
        myProgress: 0,
        averageRating: 0,
        myAssignments: [],
        currentPeriodData: null,
      });
      setRecentActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: spring,
        stiffness: 100,
      },
    },
  };

  const cardVariants: Variants = {
    hover: {
      y: -8,
      scale: 1.02,
      transition: {
        type: spring,
        stiffness: 400,
        damping: 10,
      },
    },
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <motion.h1
                className="text-3xl lg:text-4xl font-bold gradient-text mb-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                Selamat Datang! 👋
              </motion.h1>
              <motion.p
                className="text-gray-600 text-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                BPS Kota Batu - {stats.currentPeriod}
              </motion.p>
            </div>
            <div className="flex items-center space-x-3">
              <NotificationBell />
              <ExportButton
                data={{
                  overallStats: stats,
                  period: stats.currentPeriod,
                }}
                type="summary"
                title="Dashboard Summary"
                variant="secondary"
              />
              {stats.currentPeriodData && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="hidden lg:block"
                >
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl shadow-lg">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5" />
                      <span className="font-semibold">
                        {stats.currentPeriod}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <motion.div variants={itemVariants} whileHover="hover">
            <motion.div
              variants={cardVariants}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center relative z-10">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Karyawan
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalEmployees}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants} whileHover="hover">
            <motion.div
              variants={cardVariants}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center relative z-10">
                <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Selesai</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.completedAssessments}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants} whileHover="hover">
            <motion.div
              variants={cardVariants}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center relative z-10">
                <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.pendingAssessments}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants} whileHover="hover">
            <motion.div
              variants={cardVariants}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center relative z-10">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.myProgress}%
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Aksi Cepat</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div
              whileHover={{
                scale: stats.currentPeriodData ? 1.02 : 1,
                y: stats.currentPeriodData ? -4 : 0,
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() =>
                stats.currentPeriodData ? router.push("/assessment") : null
              }
              className={`group rounded-2xl p-6 shadow-lg cursor-pointer transition-all duration-300 relative overflow-hidden ${
                stats.currentPeriodData
                  ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-2xl"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              <div
                className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  stats.currentPeriodData
                    ? "bg-gradient-to-r from-blue-600/20 to-transparent"
                    : "bg-gray-200"
                }`}
              ></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <BarChart3 className="w-8 h-8" />
                  {stats.currentPeriodData && (
                    <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2">Berikan Penilaian</h3>
                <p
                  className={
                    stats.currentPeriodData ? "text-blue-100" : "text-gray-400"
                  }
                >
                  {stats.currentPeriodData
                    ? stats.pendingAssessments > 0
                      ? `Nilai ${stats.pendingAssessments} rekan kerja Anda untuk periode ini`
                      : "Tidak ada penilaian yang tersisa"
                    : "Tidak ada periode aktif untuk penilaian"}
                </p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/my-results")}
              className="group bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-lg cursor-pointer hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <Award className="w-8 h-8" />
                  <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="text-xl font-bold mb-2">Lihat Hasil Saya</h3>
                <p className="text-green-100">
                  {stats.averageRating > 0
                    ? `Rata-rata rating Anda: ${stats.averageRating}/10`
                    : "Belum ada feedback yang diterima"}
                </p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/team")}
              className="group bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg cursor-pointer hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <PieChart className="w-8 h-8" />
                  <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="text-xl font-bold mb-2">Laporan Tim</h3>
                <p className="text-purple-100">
                  Analisis mendalam performa tim
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Performance Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Performa Saya</h3>
              <div className="flex items-center space-x-2 text-yellow-500">
                <Star className="w-5 h-5 fill-current" />
                <span className="font-semibold">
                  {stats.averageRating > 0
                    ? `${stats.averageRating}/10`
                    : "Belum ada rating"}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Progress Penilaian</span>
                <span className="font-semibold">{stats.myProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.myProgress}%` }}
                  transition={{ duration: 1, delay: 1 }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full"
                ></motion.div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Aktivitas Terbaru
              </h3>
              <Zap className="w-5 h-5 text-orange-500" />
            </div>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activity.priority === "urgent"
                          ? "bg-red-500"
                          : activity.priority === "high"
                          ? "bg-orange-500"
                          : "bg-blue-500"
                      }`}
                    ></div>
                    <span className="text-gray-600">{activity.message}</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <Zap className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>Tidak ada aktivitas terbaru</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

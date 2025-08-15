// src/components/team/TeamStats.tsx
"use client";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  Award,
  Target,
  CheckCircle,
  Clock,
  AlertTriangle,
  Star,
} from "lucide-react";

interface TeamStatsProps {
  teamData: any[];
  assignmentStats: any;
}

export function TeamStats({ teamData, assignmentStats }: TeamStatsProps) {
  const totalEmployees = teamData.length;
  const avgTeamRating =
    teamData.length > 0
      ? teamData.reduce((sum, emp) => sum + (emp.averageRating || 0), 0) /
        teamData.length
      : 0;

  const topPerformers = teamData.filter(
    (emp) => (emp.averageRating || 0) >= 8
  ).length;
  const needsImprovement = teamData.filter(
    (emp) => (emp.averageRating || 0) < 6
  ).length;

  const stats = [
    {
      title: "Total Karyawan",
      value: totalEmployees,
      icon: Users,
      color: "bg-blue-500",
      bgColor: "bg-blue-100",
      textColor: "text-blue-600",
    },
    {
      title: "Rata-rata Tim",
      value: avgTeamRating.toFixed(1),
      suffix: "/10",
      icon: TrendingUp,
      color: "bg-green-500",
      bgColor: "bg-green-100",
      textColor: "text-green-600",
    },
    {
      title: "Top Performers",
      value: topPerformers,
      icon: Award,
      color: "bg-yellow-500",
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-600",
    },
    {
      title: "Perlu Bimbingan",
      value: needsImprovement,
      icon: Target,
      color: "bg-orange-500",
      bgColor: "bg-orange-100",
      textColor: "text-orange-600",
    },
  ];

  const progressStats = [
    {
      title: "Penilaian Selesai",
      value: assignmentStats.stats.completed,
      total: assignmentStats.stats.total,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Masih Pending",
      value: assignmentStats.stats.pending,
      total: assignmentStats.stats.total,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <div className="flex items-baseline space-x-1">
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  {stat.suffix && (
                    <span className="text-sm text-gray-500">{stat.suffix}</span>
                  )}
                </div>
              </div>
              <div className={`p-3 ${stat.bgColor} rounded-xl`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {progressStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 ${stat.bgColor} rounded-xl`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{stat.title}</h3>
                  <p className="text-sm text-gray-600">
                    {stat.value} dari {stat.total}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {stat.total > 0
                    ? Math.round((stat.value / stat.total) * 100)
                    : 0}
                  %
                </div>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${
                    stat.total > 0 ? (stat.value / stat.total) * 100 : 0
                  }%`,
                }}
                transition={{ duration: 1, delay: 0.7 }}
                className={`h-3 rounded-full ${
                  stat.title.includes("Selesai")
                    ? "bg-gradient-to-r from-green-400 to-green-600"
                    : "bg-gradient-to-r from-orange-400 to-orange-600"
                }`}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

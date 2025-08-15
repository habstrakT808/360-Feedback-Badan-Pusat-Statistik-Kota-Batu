// src/components/admin/AdminStatsCards.tsx
"use client";
import { motion } from "framer-motion";
import {
  Users,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Activity,
} from "lucide-react";

interface AdminStatsCardsProps {
  stats: {
    totalUsers: number;
    totalPeriods: number;
    totalAssignments: number;
    completedAssignments: number;
    pendingAssignments: number;
    completionRate: number;
  };
}

export function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  const cards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-100",
      textColor: "text-blue-600",
      change: "+12%",
      changeType: "positive",
    },
    {
      title: "Assessment Periods",
      value: stats.totalPeriods,
      icon: Calendar,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-100",
      textColor: "text-green-600",
      change: "+5%",
      changeType: "positive",
    },
    {
      title: "Completed Assessments",
      value: stats.completedAssignments,
      total: stats.totalAssignments,
      icon: CheckCircle,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-100",
      textColor: "text-purple-600",
      change: "+8%",
      changeType: "positive",
    },
    {
      title: "Pending Assessments",
      value: stats.pendingAssignments,
      icon: Clock,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-100",
      textColor: "text-orange-600",
      change: "-3%",
      changeType: "negative",
    },
    {
      title: "Completion Rate",
      value: `${stats.completionRate}%`,
      icon: TrendingUp,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-100",
      textColor: "text-emerald-600",
      change: "+15%",
      changeType: "positive",
    },
    {
      title: "System Health",
      value: "Excellent",
      icon: Activity,
      color: "from-cyan-500 to-cyan-600",
      bgColor: "bg-cyan-100",
      textColor: "text-cyan-600",
      change: "99.9%",
      changeType: "positive",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
            <div
              className={`w-full h-full bg-gradient-to-br ${card.color} rounded-full transform translate-x-6 -translate-y-6`}
            />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 ${card.bgColor} rounded-xl`}>
                <card.icon className={`w-6 h-6 ${card.textColor}`} />
              </div>
              <div
                className={`flex items-center space-x-1 text-sm font-medium ${
                  card.changeType === "positive"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                <TrendingUp
                  className={`w-4 h-4 ${
                    card.changeType === "negative" ? "transform rotate-180" : ""
                  }`}
                />
                <span>{card.change}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-600">
                {card.title}
              </h3>
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                {card.total && (
                  <span className="text-sm text-gray-500">/ {card.total}</span>
                )}
              </div>

              {/* Progress bar for completion rate */}
              {card.title === "Completion Rate" && (
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.completionRate}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={`bg-gradient-to-r ${card.color} h-2 rounded-full`}
                  />
                </div>
              )}

              {/* Progress bar for completed assessments */}
              {card.title === "Completed Assessments" && card.total && (
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${((card.value as number) / card.total) * 100}%`,
                    }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={`bg-gradient-to-r ${card.color} h-2 rounded-full`}
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// src/components/admin/ActivityFeed.tsx
"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  User,
  Calendar,
  CheckCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { AdminService } from "@/lib/admin-service";
import { formatDate } from "@/lib/utils";
import { toast } from "react-hot-toast";

export function ActivityFeed() {
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      const data = await AdminService.getActivityLogs(20);
      setActivities(data || []);
    } catch (error) {
      console.error("Failed to load activities:", error);
      setActivities([]);
      // Show user-friendly error message
      toast.error("Gagal memuat aktivitas terbaru");
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (activity: any) => {
    if (activity?.is_completed) return CheckCircle;
    return Clock;
  };

  const getActivityColor = (activity: any) => {
    if (activity?.is_completed) return "text-green-600 bg-green-100";
    return "text-orange-600 bg-orange-100";
  };

  const getActivityText = (activity: any) => {
    if (!activity?.assessor?.full_name || !activity?.assessee?.full_name) {
      return "Data aktivitas tidak lengkap";
    }

    if (activity.is_completed) {
      return `${activity.assessor.full_name} menyelesaikan penilaian untuk ${activity.assessee.full_name}`;
    }
    return `${activity.assessor.full_name} ditugaskan untuk menilai ${activity.assessee.full_name}`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={loadActivities}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      <div className="p-6 max-h-96 overflow-y-auto custom-scrollbar">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">Tidak ada aktivitas terbaru</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const IconComponent = getActivityIcon(activity);
              const colorClass = getActivityColor(activity);

              return (
                <motion.div
                  key={activity.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start space-x-3"
                >
                  <div className={`p-2 rounded-full ${colorClass}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {getActivityText(activity)}
                    </p>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span>
                        {activity.created_at
                          ? formatDate(activity.created_at)
                          : "Tanggal tidak tersedia"}
                      </span>
                      {activity.period && (
                        <>
                          <span>•</span>
                          <span>
                            {activity.period.month}/{activity.period.year}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

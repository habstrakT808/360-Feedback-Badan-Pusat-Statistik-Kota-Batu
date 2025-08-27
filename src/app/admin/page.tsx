// src/app/admin/page.tsx
"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminStatsCards } from "@/components/admin/AdminStatsCards";
import { UserManagement } from "@/components/admin/UserManagement";
import { PeriodManagement } from "@/components/admin/PeriodManagement";
import { ActivityFeed } from "@/components/admin/ActivityFeed";
import { Loading } from "@/components/ui/Loading";
import { AdminService } from "@/lib/admin-service";
import {
  Shield,
  Users,
  Calendar,
  Settings,
  BarChart3,
  Activity,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { AdminGuard } from "@/components/auth/AdminGuard";
import { CreatePeriodModal } from "@/components/admin/CreatePeriodModal";
import { PinPeriodAdmin } from "@/components/admin/PinPeriodAdmin";
import { TriwulanPeriodAdmin } from "@/components/admin/TriwulanPeriodAdmin";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatePeriodModalOpen, setIsCreatePeriodModalOpen] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await AdminService.getSystemStats();
      setStats(data);
    } catch (error: any) {
      toast.error("Failed to load system stats");
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: "overview", name: "Overview", icon: BarChart3 },
    { id: "users", name: "Users", icon: Users },
    { id: "periods", name: "Periods", icon: Calendar },
    { id: "pin_periods", name: "Pin Periods", icon: Calendar },
    { id: "triwulan_periods", name: "Triwulan Periods", icon: Calendar },
    { id: "activity", name: "Activity", icon: Activity },
    { id: "settings", name: "Settings", icon: Settings },
  ];

  const handleCreateUser = () => {
    toast.success("Create user modal will be implemented");
  };

  const handleEditUser = (user: any) => {
    toast.success("Edit user modal will be implemented");
  };

  const handleCreatePeriod = () => {
    setIsCreatePeriodModalOpen(true);
  };

  const handleEditPeriod = (period: any) => {
    // This is now handled in PeriodManagement component
  };

  const handlePeriodCreated = () => {
    // Refresh stats after creating a new period
    loadStats();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-20">
          <Loading size="lg" text="Loading admin dashboard..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <AdminGuard>
      <DashboardLayout>
        <div className="p-6 lg:p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold gradient-text">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600">
                  System management and administration
                </p>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex space-x-1 bg-gray-100 rounded-2xl p-1 mb-8"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-white text-blue-600 shadow-lg"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </motion.div>

          {/* Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "overview" && (
              <div className="space-y-8">
                <AdminStatsCards stats={stats} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <UserManagement
                      onCreateUser={handleCreateUser}
                      onEditUser={handleEditUser}
                    />
                  </div>
                  <div>
                    <ActivityFeed />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <UserManagement
                onCreateUser={handleCreateUser}
                onEditUser={handleEditUser}
              />
            )}

            {activeTab === "periods" && (
              <PeriodManagement
                onCreatePeriod={handleCreatePeriod}
                onEditPeriod={handleEditPeriod}
                onPeriodCreated={handlePeriodCreated}
              />
            )}

            {activeTab === "activity" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ActivityFeed />
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    System Logs
                  </h3>
                  <p className="text-gray-600">
                    System logs will be displayed here
                  </p>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  System Settings
                </h2>
                <p className="text-gray-600">
                  System settings panel will be implemented here
                </p>
              </div>
            )}

            {activeTab === "pin_periods" && <PinPeriodAdmin />}
            {activeTab === "triwulan_periods" && <TriwulanPeriodAdmin />}
          </motion.div>
        </div>
      </DashboardLayout>

      {/* Create Period Modal */}
      <CreatePeriodModal
        isOpen={isCreatePeriodModalOpen}
        onClose={() => setIsCreatePeriodModalOpen(false)}
        onSuccess={handlePeriodCreated}
      />
    </AdminGuard>
  );
}

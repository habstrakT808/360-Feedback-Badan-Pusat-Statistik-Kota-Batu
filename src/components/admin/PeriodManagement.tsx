// src/components/admin/PeriodManagement.tsx
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Info,
} from "lucide-react";
import { AdminService } from "@/lib/admin-service";
import { formatDate } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { EditPeriodModal } from "./EditPeriodModal";

interface PeriodManagementProps {
  onCreatePeriod: () => void;
  onEditPeriod: (period: any) => void;
  onPeriodCreated?: () => void;
}

export function PeriodManagement({
  onCreatePeriod,
  onEditPeriod,
  onPeriodCreated,
}: PeriodManagementProps) {
  const [periods, setPeriods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<any>(null);

  useEffect(() => {
    loadPeriods();
  }, []);

  // Listen for period creation
  useEffect(() => {
    if (onPeriodCreated) {
      loadPeriods();
    }
  }, [onPeriodCreated]);

  const loadPeriods = async () => {
    try {
      console.log("Loading periods...");
      const data = await AdminService.getAllPeriods();
      console.log("Periods loaded:", data);
      setPeriods(data);
    } catch (error: any) {
      console.error("Error loading periods:", error);
      toast.error("Failed to load periods: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAssignments = async (periodId: string) => {
    if (
      !confirm(
        "Generate new assignments for this period? This will replace existing assignments."
      )
    ) {
      return;
    }

    try {
      await AdminService.generateAssignments(periodId);
      toast.success("Assignments generated successfully");
    } catch (error: any) {
      toast.error("Failed to generate assignments: " + error.message);
    }
  };

  const handleDeletePeriod = async (periodId: string) => {
    if (!confirm("Delete this period? All related data will be lost.")) {
      return;
    }

    try {
      await AdminService.deletePeriod(periodId);
      setPeriods(periods.filter((p) => p.id !== periodId));
      toast.success("Period deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete period: " + error.message);
    }
  };

  const handleEditPeriod = (period: any) => {
    setSelectedPeriod(period);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    loadPeriods();
    setIsEditModalOpen(false);
    setSelectedPeriod(null);
  };

  const getStatusColor = (period: any) => {
    if (period.is_completed) return "bg-purple-100 text-purple-700";
    if (period.is_active) return "bg-green-100 text-green-700";
    const endDate = new Date(period.end_date);
    const now = new Date();
    if (endDate < now) return "bg-gray-100 text-gray-700";
    return "bg-blue-100 text-blue-700";
  };

  const getStatusText = (period: any) => {
    if (period.is_completed) return "Completed";
    if (period.is_active) return "Active";
    const endDate = new Date(period.end_date);
    const now = new Date();
    if (endDate < now) return "Expired";
    return "Scheduled";
  };

  const isPeriodStarted = (period: any) => {
    const startDate = new Date(period.start_date);
    const now = new Date();
    return now >= startDate;
  };

  const getGenerateButtonText = (period: any) => {
    // Check if assignments exist for this period
    const hasAssignments =
      period.assigned_count > 0 || period.completed_count > 0;

    if (hasAssignments) {
      return "Periode Dimulai";
    }
    return "Generate";
  };

  const isGenerateButtonDisabled = (period: any) => {
    // Check if assignments exist for this period
    const hasAssignments =
      period.assigned_count > 0 || period.completed_count > 0;

    // Disable if assignments already exist, regardless of period status
    return hasAssignments;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Assessment Periods
            </h2>
            <p className="text-gray-600">
              Manage assessment periods and assignments
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCreatePeriod}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Period</span>
          </motion.button>
        </div>
      </div>

      {/* Periods Grid */}
      <div className="p-6">
        {periods.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No periods found
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first assessment period to get started
            </p>
            <button
              onClick={onCreatePeriod}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Create Period
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {periods.map((period, index) => (
              <motion.div
                key={period.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="bg-gray-50 rounded-2xl p-6 hover:bg-white hover:shadow-lg transition-all duration-300 border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-gray-900">
                      {new Date(0, period.month - 1).toLocaleString("id-ID", {
                        month: "long",
                      })}{" "}
                      {period.year}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isPeriodStarted(period) && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        Started
                      </span>
                    )}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        period
                      )}`}
                    >
                      {getStatusText(period)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Start Date</span>
                    <span className="font-medium">
                      {formatDate(period.start_date)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">End Date</span>
                    <span className="font-medium">
                      {formatDate(period.end_date)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">
                      {Math.ceil(
                        (new Date(period.end_date).getTime() -
                          new Date(period.start_date).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{" "}
                      days
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {period.assigned_count || 0}
                    </div>
                    <div className="text-xs text-gray-600">Assigned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {period.completed_count || 0}
                    </div>
                    <div className="text-xs text-gray-600">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">
                      {(period.assigned_count || 0) -
                        (period.completed_count || 0)}
                    </div>
                    <div className="text-xs text-gray-600">Pending</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative group">
                    <motion.button
                      whileHover={{
                        scale: isGenerateButtonDisabled(period) ? 1 : 1.05,
                      }}
                      whileTap={{
                        scale: isGenerateButtonDisabled(period) ? 1 : 0.95,
                      }}
                      onClick={() =>
                        !isGenerateButtonDisabled(period) &&
                        handleGenerateAssignments(period.id)
                      }
                      disabled={isGenerateButtonDisabled(period)}
                      className={`w-full flex items-center justify-center space-x-1 px-3 py-2 rounded-lg transition-colors text-sm ${
                        isGenerateButtonDisabled(period)
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {isGenerateButtonDisabled(period) ? (
                        <Info className="w-3 h-3" />
                      ) : (
                        <Users className="w-3 h-3" />
                      )}
                      <span>{getGenerateButtonText(period)}</span>
                    </motion.button>
                    {isGenerateButtonDisabled(period) && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        Assignments sudah dibuat
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleEditPeriod(period)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePeriod(period.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Period Modal */}
      <EditPeriodModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPeriod(null);
        }}
        onSuccess={handleEditSuccess}
        period={selectedPeriod}
      />
    </div>
  );
}

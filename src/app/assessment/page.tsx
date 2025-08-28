// src/app/assessment/page.tsx (REPLACE COMPLETE FILE)
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import { useUserRole } from "@/hooks/useUserRole";
import { AssessmentService } from "@/lib/assessment-service";
import { DraftService } from "@/lib/draft-service";
import { SupervisorService } from "@/lib/supervisor-service";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loading } from "@/components/ui/Loading";
import { toast } from "react-hot-toast";
import { Users, UserCheck, BarChart3, AlertCircle } from "lucide-react";

// Regular user assessment component (existing)
function RegularUserAssessment() {
  const { user } = useStore();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAssignments();
    }
  }, [user]);

  const loadAssignments = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const [assignmentsData, periodData] = await Promise.all([
        AssessmentService.getMyAssignments(user.id),
        AssessmentService.getCurrentPeriod(),
      ]);

      setAssignments(assignmentsData || []);
      setCurrentPeriod(periodData);
    } catch (error: any) {
      console.error("Error loading assignments:", error);
      // Don't show error toast if it's just no active period
      if (!error.message?.includes('No active period')) {
        toast.error("Gagal memuat data penilaian: " + error.message);
      }
      setAssignments([]);
      setCurrentPeriod(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loading size="lg" text="Memuat data penilaian..." />
      </div>
    );
  }

  if (!currentPeriod) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Tidak Ada Periode Aktif
          </h3>
          <p className="text-gray-600">
            Saat ini tidak ada periode penilaian yang aktif. Hubungi admin untuk
            informasi lebih lanjut.
          </p>
        </motion.div>
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
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Beri Penilaian
            </h1>
            <p className="text-gray-600 text-lg">
              Periode:{" "}
              {new Date(0, currentPeriod.month - 1).toLocaleString("id-ID", {
                month: "long",
              })}{" "}
              {currentPeriod.year}
            </p>
          </div>
        </div>
      </motion.div>

      {assignments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Semua Penilaian Selesai
          </h3>
          <p className="text-gray-600">
            Anda telah menyelesaikan semua penilaian untuk periode ini.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment, index) => {
            const isCompleted = Boolean(assignment.is_completed);
            const draftKey = user
              ? `draft:regular:${user.id}:${assignment.id}`
              : "";
            const hasDraft = !!DraftService.get(draftKey);
            const statusLabel = isCompleted
              ? "Selesai"
              : hasDraft
              ? "Draft"
              : "Belum Dinilai";
            const statusColor = isCompleted
              ? "bg-green-100 text-green-700 border-green-200"
              : hasDraft
              ? "bg-yellow-100 text-yellow-700 border-yellow-200"
              : "bg-blue-100 text-blue-700 border-blue-200";
            return (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className={
                  "bg-white rounded-2xl p-6 shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-xl cursor-pointer"
                }
                onClick={() => {
                  window.location.href = `/assessment/${assignment.id}`;
                }}
              >
                <div className="text-center relative">
                  <span
                    className={`absolute top-0 right-0 -mt-2 mr-0 px-3 py-1 text-xs font-semibold rounded-full border ${statusColor}`}
                  >
                    {statusLabel}
                  </span>
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-xl">
                      {assignment.assessee?.full_name?.charAt(0) ||
                        assignment.assessee?.email?.charAt(0)}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {assignment.assessee?.full_name ||
                      assignment.assessee?.email}
                  </h3>
                  {assignment.assessee?.position && (
                    <p className="text-gray-600 mb-1">
                      {assignment.assessee.position}
                    </p>
                  )}
                  {assignment.assessee?.department && (
                    <p className="text-gray-500 text-sm">
                      {assignment.assessee.department}
                    </p>
                  )}
                  <div
                    className={`mt-4 flex items-center justify-center space-x-2 ${
                      isCompleted ? "text-green-700" : "text-blue-600"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {isCompleted ? "Edit Penilaian" : "Beri Penilaian"}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Supervisor user selection component
function SupervisorAssessment() {
  const [users, setUsers] = useState<any[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useStore();
  const [assessedIds, setAssessedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [usersData, periodData] = await Promise.all([
        SupervisorService.getAllAssessableUsers(),
        AssessmentService.getCurrentPeriod(),
      ]);
      setUsers(usersData);
      setCurrentPeriod(periodData);
      if (periodData) {
        const ids = await SupervisorService.getAssessedUserIds(periodData.id);
        setAssessedIds(ids);
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error("Gagal memuat data: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loading size="lg" text="Memuat daftar karyawan..." />
      </div>
    );
  }

  if (!currentPeriod) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Tidak Ada Periode Aktif
          </h3>
          <p className="text-gray-600">
            Saat ini tidak ada periode penilaian yang aktif. Hubungi admin untuk
            informasi lebih lanjut.
          </p>
        </motion.div>
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
          <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl">
            <UserCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Penilaian Supervisor
            </h1>
            <p className="text-gray-600 text-lg">
              Pilih karyawan yang ingin Anda nilai - Periode:{" "}
              {new Date(0, currentPeriod.month - 1).toLocaleString("id-ID", {
                month: "long",
              })}{" "}
              {currentPeriod.year}
            </p>
          </div>
        </div>
      </motion.div>

      {users.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Tidak Ada Karyawan
          </h3>
          <p className="text-gray-600">
            Tidak ada karyawan yang dapat dinilai saat ini.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((u, index) => {
            const draftKey =
              user && currentPeriod
                ? `draft:supervisor:${user.id}:${u.id}:${currentPeriod.id}`
                : "";
            const hasDraft = !!DraftService.get(draftKey);
            const isCompleted = assessedIds.has(u.id);
            const statusLabel = isCompleted
              ? "Selesai"
              : hasDraft
              ? "Draft"
              : "Belum Dinilai";
            const statusColor = isCompleted
              ? "bg-green-100 text-green-700 border-green-200"
              : hasDraft
              ? "bg-yellow-100 text-yellow-700 border-yellow-200"
              : "bg-purple-100 text-purple-700 border-purple-200";
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() =>
                  (window.location.href = `/assessment/supervisor/${u.id}`)
                }
              >
                <div className="text-center relative">
                  <span
                    className={`absolute top-0 right-0 -mt-2 mr-0 px-3 py-1 text-xs font-semibold rounded-full border ${statusColor}`}
                  >
                    {statusLabel}
                  </span>
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-xl">
                      {u.full_name?.charAt(0) || u.email?.charAt(0)}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {u.full_name || u.email}
                  </h3>
                  {u.position && (
                    <p className="text-gray-600 mb-1">{u.position}</p>
                  )}
                  {u.department && (
                    <p className="text-gray-500 text-sm">{u.department}</p>
                  )}
                  <div
                    className={`mt-4 flex items-center justify-center space-x-2 ${
                      isCompleted ? "text-green-700" : "text-purple-600"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {isCompleted ? "Edit Penilaian" : "Beri Penilaian"}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AssessmentPage() {
  const { user } = useStore();
  const router = useRouter();
  const { isSupervisor, isLoading, isAdmin } = useUserRole();

  useEffect(() => {
    if (isAdmin) {
      router.replace("/admin");
    }
  }, [isAdmin, router]);

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
      {isSupervisor ? <SupervisorAssessment /> : <RegularUserAssessment />}
    </DashboardLayout>
  );
}

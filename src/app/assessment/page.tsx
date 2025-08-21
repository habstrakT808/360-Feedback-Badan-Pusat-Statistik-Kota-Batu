// src/app/assessment/page.tsx (REPLACE COMPLETE FILE)
"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import { useUserRole } from "@/hooks/useUserRole";
import { AssessmentService } from "@/lib/assessment-service";
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

      setAssignments(assignmentsData);
      setCurrentPeriod(periodData);
    } catch (error: any) {
      console.error("Error loading assignments:", error);
      toast.error("Gagal memuat data penilaian: " + error.message);
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
          {assignments.map((assignment, index) => (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() =>
                (window.location.href = `/assessment/${assignment.id}`)
              }
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">
                    {assignment.assessee?.full_name?.charAt(0) ||
                      assignment.assessee?.email?.charAt(0)}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {assignment.assessee?.full_name || assignment.assessee?.email}
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
                <div className="mt-4 flex items-center justify-center space-x-2 text-blue-600">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm font-medium">Beri Penilaian</span>
                </div>
              </div>
            </motion.div>
          ))}
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
          {users.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() =>
                (window.location.href = `/assessment/supervisor/${user.id}`)
              }
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">
                    {user.full_name?.charAt(0) || user.email?.charAt(0)}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {user.full_name || user.email}
                </h3>
                {user.position && (
                  <p className="text-gray-600 mb-1">{user.position}</p>
                )}
                {user.department && (
                  <p className="text-gray-500 text-sm">{user.department}</p>
                )}
                <div className="mt-4 flex items-center justify-center space-x-2 text-purple-600">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm font-medium">Beri Penilaian</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AssessmentPage() {
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
      {isSupervisor ? <SupervisorAssessment /> : <RegularUserAssessment />}
    </DashboardLayout>
  );
}

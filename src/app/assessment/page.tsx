// src/app/assessment/page.tsx
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AssessmentForm } from "@/components/assessment/AssessmentForm";
import { Loading } from "@/components/ui/Loading";
import { AssessmentService } from "@/lib/assessment-service";
import { useStore } from "@/store/useStore";
import {
  Users,
  Clock,
  CheckCircle,
  Star,
  ArrowRight,
  Calendar,
  Target,
} from "lucide-react";
import { getInitials, formatDate } from "@/lib/utils";
import { toast } from "react-hot-toast";

export default function AssessmentPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useStore();

  useEffect(() => {
    if (user) {
      loadAssignments();
    }
  }, [user]);

  const loadAssignments = async () => {
    try {
      const data = await AssessmentService.getMyAssignments(user!.id);
      setAssignments(data || []);
    } catch (error: any) {
      toast.error("Gagal memuat data penilaian");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssessmentComplete = () => {
    setSelectedAssignment(null);
    loadAssignments();
    toast.success("Penilaian berhasil disimpan! 🎉");
  };

  if (selectedAssignment) {
    return (
      <AssessmentForm
        assignment={selectedAssignment}
        onComplete={handleAssessmentComplete}
        onBack={() => setSelectedAssignment(null)}
      />
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <Target className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">
                Penilaian 360°
              </h1>
              <p className="text-gray-600">
                Berikan penilaian untuk rekan kerja Anda
              </p>
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loading size="lg" text="Memuat data penilaian..." />
          </div>
        ) : assignments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-gradient-to-r from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Semua Penilaian Selesai! 🎉
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Anda telah menyelesaikan semua penilaian untuk periode ini. Terima
              kasih atas partisipasinya!
            </p>
          </motion.div>
        ) : (
          <>
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Penilaian
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {assignments.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Belum Selesai
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {assignments.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Deadline
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {assignments[0]?.period?.end_date
                        ? formatDate(assignments[0].period.end_date)
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Assignment List */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Daftar Penilaian ({assignments.length})
              </h2>

              {assignments.map((assignment, index) => (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedAssignment(assignment)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg">
                        {assignment.assessee.avatar_url ? (
                          <img
                            src={assignment.assessee.avatar_url}
                            alt={assignment.assessee.full_name}
                            className="w-16 h-16 rounded-2xl object-cover"
                          />
                        ) : (
                          getInitials(assignment.assessee.full_name)
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {assignment.assessee.full_name}
                        </h3>
                        <p className="text-gray-600 mb-2">
                          {assignment.assessee.position} •{" "}
                          {assignment.assessee.department}
                        </p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="flex items-center space-x-1 text-blue-600">
                            <Star className="w-4 h-4" />
                            <span>7 Aspek Penilaian</span>
                          </span>
                          <span className="flex items-center space-x-1 text-green-600">
                            <Clock className="w-4 h-4" />
                            <span>~15 menit</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="flex items-center space-x-3"
                    >
                      <div className="text-right mr-4">
                        <div className="text-sm text-gray-500">Status</div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                          Belum Selesai
                        </span>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 hover:bg-blue-200 transition-colors">
                        <ArrowRight className="w-6 h-6" />
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

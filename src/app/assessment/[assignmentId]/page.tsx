// src/app/assessment/[assignmentId]/page.tsx (REPLACE COMPLETE FILE)
"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { AssessmentService } from "@/lib/assessment-service";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loading } from "@/components/ui/Loading";
import { RatingInput } from "@/components/ui/RatingInput";
import { toast } from "react-hot-toast";
import { ASSESSMENT_ASPECTS } from "@/lib/assessment-data";
import { DraftService } from "@/lib/draft-service";
import {
  BarChart3,
  Save,
  ArrowLeft,
  AlertCircle,
  User,
  Calendar,
  Info,
} from "lucide-react";

export default function RegularAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useStore();
  const assignmentId = params.assignmentId as string;

  const [assignment, setAssignment] = useState<any>(null);
  const [responses, setResponses] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load draft on mount first
  const draftKey = user ? `draft:regular:${user.id}:${assignmentId}` : "";
  useEffect(() => {
    if (!user || !assignmentId) return;
    const draft = DraftService.get(draftKey);
    if (draft) setResponses(draft);
  }, [user, assignmentId]);

  useEffect(() => {
    if (user && assignmentId) {
      loadAssignment();
    }
  }, [user, assignmentId]);

  const loadAssignment = async () => {
    if (!user || !assignmentId) return;

    try {
      setIsLoading(true);

      // Get user's assignments to find this specific assignment
      const assignments = await AssessmentService.getMyAssignments(user.id);
      const targetAssignment = assignments.find((a: any) => a.id === assignmentId);

      if (!targetAssignment) {
        toast.error("Assignment tidak ditemukan atau sudah diselesaikan");
        router.push("/assessment");
        return;
      }

      setAssignment(targetAssignment);

      // If assignment already completed, load existing responses for editing
      if (targetAssignment.is_completed) {
        const existing = await AssessmentService.getExistingResponses(
          targetAssignment.id
        );
        if (existing && existing.length > 0) {
          const responseMap: any = {};
          existing.forEach((resp: any) => {
            if (!responseMap[resp.aspect]) {
              responseMap[resp.aspect] = {
                rating: resp.rating,
                comment: resp.comment || "",
              };
            }
          });
          setResponses(responseMap);
        }
      }
    } catch (error: any) {
      console.error("Error loading assignment:", error);
      toast.error("Gagal memuat data assignment: " + error.message);
      router.push("/assessment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRatingChange = (aspectId: string, rating: number) => {
    setResponses((prev: any) => ({
      ...prev,
      [aspectId]: {
        ...prev[aspectId],
        rating,
      },
    }));
    const next = {
      ...responses,
      [aspectId]: { ...(responses[aspectId] || {}), rating },
    };
    if (draftKey) DraftService.save(draftKey, next);
  };

  const handleCommentChange = (aspectId: string, comment: string) => {
    setResponses((prev: any) => ({
      ...prev,
      [aspectId]: {
        ...prev[aspectId],
        comment,
      },
    }));
    const next = {
      ...responses,
      [aspectId]: { ...(responses[aspectId] || {}), comment },
    };
    if (draftKey) DraftService.save(draftKey, next);
  };

  const validateResponses = () => {
    const missingResponses = ASSESSMENT_ASPECTS.filter(
      (aspect) =>
        !responses[aspect.id] ||
        !responses[aspect.id].rating ||
        responses[aspect.id].rating < 80 ||
        responses[aspect.id].rating > 90
    );

    return missingResponses.length === 0;
  };

  const handleSubmit = async () => {
    if (!validateResponses()) {
      toast.error("Mohon lengkapi semua penilaian dengan rating 80-90");
      return;
    }

    if (!assignment) {
      toast.error("Data assignment tidak lengkap");
      return;
    }

    try {
      setIsSubmitting(true);

      const feedbackResponses: any[] = [];

      // For each aspect, create responses for all indicators with the same rating
      ASSESSMENT_ASPECTS.forEach((aspect) => {
        const aspectResponse = responses[aspect.id];

        if (aspectResponse && aspectResponse.rating) {
          // Create a response for each indicator with the same rating (combined assessment)
          aspect.indicators.forEach((indicator) => {
            feedbackResponses.push({
              aspect: aspect.id,
              indicator,
              rating: aspectResponse.rating,
              comment: aspectResponse.comment || "",
            });
          });
        }
      });

      await AssessmentService.submitFeedback(assignment.id, feedbackResponses);

      // clear draft on success
      if (draftKey) DraftService.clear(draftKey);

      toast.success(
        assignment.is_completed
          ? "Penilaian berhasil diperbarui!"
          : "Penilaian berhasil disimpan!"
      );
      router.push("/assessment");
    } catch (error: any) {
      console.error("Error submitting assessment:", error);
      toast.error("Gagal menyimpan penilaian: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-20">
          <Loading size="lg" text="Memuat data penilaian..." />
        </div>
      </DashboardLayout>
    );
  }

  if (!assignment) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Assignment Tidak Ditemukan
            </h3>
            <p className="text-gray-600 mb-6">
              Assignment tidak ditemukan atau sudah diselesaikan.
            </p>
            <button
              onClick={() => router.push("/assessment")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Kembali ke Assessment
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => router.push("/assessment")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Beri Penilaian
              </h1>
              <p className="text-gray-600">
                Menilai:{" "}
                {assignment.assessee?.full_name || assignment.assessee?.email}
              </p>
            </div>
          </div>

          {/* User Info Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {assignment.assessee?.full_name?.charAt(0) ||
                    assignment.assessee?.email?.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {assignment.assessee?.full_name || assignment.assessee?.email}
                </h2>
                {assignment.assessee?.position && (
                  <p className="text-gray-600">
                    {assignment.assessee.position}
                  </p>
                )}
                {assignment.assessee?.department && (
                  <p className="text-gray-500">
                    {assignment.assessee.department}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Period Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-blue-800">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">
                Periode:{" "}
                {assignment.period
                  ? `${new Date(0, assignment.period.month - 1).toLocaleString(
                      "id-ID",
                      { month: "long" }
                    )} ${assignment.period.year}`
                  : "N/A"}
              </span>
            </div>
            <p className="text-blue-700 text-sm mt-1">
              Skala penilaian: 80-90 per aspek (Bobot rekan kerja: 40%)
            </p>
          </div>
        </motion.div>

        {/* Assessment Form - Per Aspek */}
        <div className="space-y-8">
          {ASSESSMENT_ASPECTS.map((aspect, aspectIndex) => {
            const response = responses[aspect.id] || {
              rating: undefined,
              comment: "",
            };

            return (
              <motion.div
                key={aspect.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: aspectIndex * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {aspect.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{aspect.description}</p>

                  {/* Show all indicators */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Info className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-900">
                        Indikator Penilaian:
                      </h4>
                    </div>
                    <ul className="space-y-2">
                      {aspect.indicators.map((indicator, index) => (
                        <li
                          key={`${aspect.id}-indicator-${index}`}
                          className="flex items-start space-x-3"
                        >
                          <div className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                            {index + 1}
                          </div>
                          <p className="text-blue-800 text-sm leading-relaxed">
                            {indicator}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rating Aspek {aspect.name} (80-90)
                    </label>
                    <RatingInput
                      value={response.rating}
                      onChange={(rating) =>
                        handleRatingChange(aspect.id, rating)
                      }
                      minValue={80}
                      maxValue={90}
                      max={90}
                      showNumber={true}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Komentar untuk Aspek {aspect.name} (Opsional)
                    </label>
                    <textarea
                      value={response.comment}
                      onChange={(e) =>
                        handleCommentChange(aspect.id, e.target.value)
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Berikan komentar untuk aspek ${aspect.name}...`}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex justify-center"
        >
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Simpan Penilaian</span>
              </>
            )}
          </button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

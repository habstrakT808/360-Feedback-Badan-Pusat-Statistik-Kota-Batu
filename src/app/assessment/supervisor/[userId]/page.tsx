// src/app/assessment/supervisor/[userId]/page.tsx (REPLACE COMPLETE FILE)
"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { SupervisorService } from "@/lib/supervisor-service";
import { AssessmentService } from "@/lib/assessment-service";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loading } from "@/components/ui/Loading";
import { RatingInput } from "@/components/ui/RatingInput";
import { toast } from "react-hot-toast";
import { ASSESSMENT_ASPECTS } from "@/lib/assessment-data";
import { DraftService } from "@/lib/draft-service";
import {
  UserCheck,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Star,
  Info,
} from "lucide-react";

export default function SupervisorAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useStore();
  const userId = params.userId as string;

  const [targetUser, setTargetUser] = useState<any>(null);
  const [currentPeriod, setCurrentPeriod] = useState<any>(null);
  const [responses, setResponses] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingAssessment, setHasExistingAssessment] = useState(false);

  useEffect(() => {
    if (user && userId) {
      loadData();
    }
  }, [user, userId]);

  // Load draft on mount and persist on change
  const draftKey =
    user && currentPeriod
      ? `draft:supervisor:${user.id}:${userId}:${currentPeriod.id}`
      : "";

  useEffect(() => {
    if (!user || !userId) return;
    // tentative key without period while loading period; final load after period set below
    const preKey = `draft:supervisor:${user.id}:${userId}`;
    const draft = DraftService.get(preKey);
    if (draft) setResponses(draft);
  }, [user, userId]);

  useEffect(() => {
    if (!user || !currentPeriod) return;
    const draft = DraftService.get(draftKey);
    if (draft) setResponses(draft);
  }, [user, currentPeriod]);

  const loadData = async () => {
    if (!user || !userId) return;

    try {
      setIsLoading(true);

      // Get current period
      const periodData = await AssessmentService.getCurrentPeriod();
      if (!periodData) {
        // Don't show error toast, just redirect gracefully
        router.push("/assessment");
        return;
      }
      setCurrentPeriod(periodData);

      // Get all assessable users to find target user
      const users = await SupervisorService.getAllAssessableUsers();
      const target = users.find((u) => u.id === userId);
      if (!target) {
        toast.error("Pengguna tidak ditemukan atau tidak dapat dinilai");
        router.push("/assessment");
        return;
      }
      setTargetUser(target);

      // Check if assessment already exists
      const hasAssessed = await SupervisorService.hasAssessedUser(
        userId,
        periodData.id
      );
      setHasExistingAssessment(hasAssessed);

      // Load existing assessment if any
      if (hasAssessed) {
        const existingResponses =
          await SupervisorService.getExistingSupervisorAssessment(
            userId,
            periodData.id
          );

        // Group existing responses by aspect (since we're now doing per-aspect assessment)
        const responseMap: any = {};
        existingResponses?.forEach((response: any) => {
          if (!responseMap[response.aspect]) {
            responseMap[response.aspect] = {
              rating: response.rating,
              comment: response.comment || "",
            };
          }
        });
        setResponses(responseMap);
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error("Gagal memuat data: " + error.message);
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
    // autosave
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
        responses[aspect.id].rating < 1 ||
        responses[aspect.id].rating > 100
    );

    return missingResponses.length === 0;
  };

  const handleSubmit = async () => {
    if (!validateResponses()) {
      toast.error("Mohon lengkapi semua penilaian dengan rating 1-100");
      return;
    }

    if (!currentPeriod || !targetUser) {
      toast.error("Data tidak lengkap");
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

      await SupervisorService.submitSupervisorAssessment(
        targetUser.id,
        currentPeriod.id,
        feedbackResponses
      );

      // clear draft on success
      if (draftKey) DraftService.clear(draftKey);

      toast.success(
        hasExistingAssessment
          ? "Penilaian berhasil diperbarui!"
          : "Penilaian berhasil disimpan!"
      );

      router.push("/assessment");
    } catch (error: any) {
      console.error("Error submitting assessment:", error);

      // Log detailed error information
      if (error.details) {
        console.error("Error details:", error.details);
      }
      if (error.hint) {
        console.error("Error hint:", error.hint);
      }
      if (error.code) {
        console.error("Error code:", error.code);
      }

      // Show more specific error message
      let errorMessage = "Gagal menyimpan penilaian";
      if (error.message) {
        errorMessage += ": " + error.message;
      } else if (error.details) {
        errorMessage += ": " + error.details;
      } else if (error.hint) {
        errorMessage += ": " + error.hint;
      }

      toast.error(errorMessage);
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

  if (!targetUser || !currentPeriod) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Data Tidak Ditemukan
            </h3>
            <p className="text-gray-600 mb-6">
              Pengguna atau periode penilaian tidak ditemukan.
            </p>
            <button
              onClick={() => router.push("/assessment")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Kembali
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
            <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl">
              <UserCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Penilaian Supervisor
              </h1>
              <p className="text-gray-600">
                Menilai: {targetUser.full_name || targetUser.email}
              </p>
            </div>
          </div>

          {/* User Info Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {targetUser.full_name?.charAt(0) ||
                    targetUser.email?.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {targetUser.full_name || targetUser.email}
                </h2>
                {targetUser.position && (
                  <p className="text-gray-600">{targetUser.position}</p>
                )}
                {targetUser.department && (
                  <p className="text-gray-500">{targetUser.department}</p>
                )}
              </div>
              {hasExistingAssessment && (
                <div className="ml-auto">
                  <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-2 rounded-full">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Sudah Dinilai</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Period Info */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-purple-800">
              <Star className="w-5 h-5" />
              <span className="font-medium">
                Periode:{" "}
                {new Date(0, currentPeriod.month - 1).toLocaleString("id-ID", {
                  month: "long",
                })}{" "}
                {currentPeriod.year}
              </span>
            </div>
            <p className="text-purple-700 text-sm mt-1">
              Skala penilaian: 1-100 per aspek (Bobot supervisor: 60%)
            </p>
          </div>
        </motion.div>

        {/* Assessment Form - Per Aspek */}
        <div className="space-y-8">
          {ASSESSMENT_ASPECTS.map((aspect, aspectIndex) => {
            const response =
              responses[aspect.id] ||
              ({ rating: undefined, comment: "" } as any);

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
                      Rating Aspek {aspect.name} (1-100)
                    </label>
                    <RatingInput
                      value={response.rating}
                      onChange={(rating) =>
                        handleRatingChange(aspect.id, rating)
                      }
                      minValue={1}
                      maxValue={100}
                      max={100}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>
                  {hasExistingAssessment
                    ? "Perbarui Penilaian"
                    : "Simpan Penilaian"}
                </span>
              </>
            )}
          </button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

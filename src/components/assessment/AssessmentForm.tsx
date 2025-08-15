// src/components/assessment/AssessmentForm.tsx
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  ChevronLeft,
  ChevronRight,
  Send,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { RatingInput } from "@/components/ui/RatingInput";
import { ASSESSMENT_ASPECTS } from "@/lib/assessment-data";
import { AssessmentService } from "@/lib/assessment-service";
import { toast } from "react-hot-toast";
import { getInitials } from "@/lib/utils";
import confetti from "canvas-confetti";

const assessmentSchema = z.object({
  responses: z.array(
    z.object({
      aspect: z.string(),
      indicator: z.string(),
      rating: z
        .number()
        .min(1, "Rating minimal 1")
        .max(10, "Rating maksimal 10"),
      comment: z.string().optional(),
    })
  ),
});

type AssessmentForm = z.infer<typeof assessmentSchema>;

interface AssessmentFormProps {
  assignment: any;
  onComplete: () => void;
  onBack: () => void;
}

export function AssessmentForm({
  assignment,
  onComplete,
  onBack,
}: AssessmentFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCommentFor, setShowCommentFor] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AssessmentForm>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      responses: ASSESSMENT_ASPECTS.flatMap((aspect) =>
        aspect.indicators.map((indicator) => ({
          aspect: aspect.id,
          indicator,
          rating: 0,
          comment: "",
        }))
      ),
    },
  });

  const responses = watch("responses");
  const currentAspect = ASSESSMENT_ASPECTS[currentStep];
  const totalSteps = ASSESSMENT_ASPECTS.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const currentResponses = responses.filter(
    (r) => r.aspect === currentAspect.id
  );
  const isStepComplete = currentResponses.every((r) => r.rating > 0);
  const totalComplete = responses.filter((r) => r.rating > 0).length;
  const totalQuestions = responses.length;

  const onSubmit = async (data: AssessmentForm) => {
    setIsSubmitting(true);
    try {
      await AssessmentService.submitFeedback(assignment.id, data.responses);

      // Celebration animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast.success("Penilaian berhasil dikirim! 🎉");
      onComplete();
    } catch (error: any) {
      toast.error("Gagal mengirim penilaian: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {assignment.assessee.avatar_url ? (
                    <img
                      src={assignment.assessee.avatar_url}
                      alt={assignment.assessee.full_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    getInitials(assignment.assessee.full_name)
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Menilai: {assignment.assessee.full_name}
                  </h1>
                  <p className="text-gray-600">
                    {assignment.assessee.position} •{" "}
                    {assignment.assessee.department}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-600">Progress</div>
              <div className="text-2xl font-bold text-blue-600">
                {totalComplete}/{totalQuestions}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>
                Langkah {currentStep + 1} dari {totalSteps}
              </span>
              <span>{Math.round(progress)}% selesai</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Assessment Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
            >
              {/* Aspect Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 px-6 py-3 rounded-full mb-4"
                >
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">
                    Aspek {currentStep + 1}: {currentAspect.name}
                  </span>
                </motion.div>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Berikan penilaian untuk setiap indikator berikut berdasarkan
                  pengamatan Anda terhadap {assignment.assessee.full_name}
                </p>
              </div>

              {/* Indicators */}
              <div className="space-y-8">
                {currentAspect.indicators.map((indicator, indicatorIndex) => {
                  const responseIndex = responses.findIndex(
                    (r) =>
                      r.aspect === currentAspect.id && r.indicator === indicator
                  );

                  return (
                    <motion.div
                      key={indicator}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: indicatorIndex * 0.1 }}
                      className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors"
                    >
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {indicator}
                        </h3>
                      </div>

                      <Controller
                        control={control}
                        name={`responses.${responseIndex}.rating`}
                        render={({ field }) => (
                          <RatingInput
                            value={field.value}
                            onChange={field.onChange}
                            max={10}
                            size="md"
                          />
                        )}
                      />

                      {/* Comment Section */}
                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={() =>
                            setShowCommentFor(
                              showCommentFor ===
                                `${currentStep}-${indicatorIndex}`
                                ? null
                                : `${currentStep}-${indicatorIndex}`
                            )
                          }
                          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            Tambah Komentar (Opsional)
                          </span>
                        </button>

                        <AnimatePresence>
                          {showCommentFor ===
                            `${currentStep}-${indicatorIndex}` && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="mt-3"
                            >
                              <Controller
                                control={control}
                                name={`responses.${responseIndex}.comment`}
                                render={({ field }) => (
                                  <textarea
                                    {...field}
                                    placeholder="Berikan komentar atau saran untuk perbaikan..."
                                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    rows={3}
                                  />
                                )}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                <motion.button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  whileHover={{ scale: currentStep === 0 ? 1 : 1.05 }}
                  whileTap={{ scale: currentStep === 0 ? 1 : 0.95 }}
                  className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Sebelumnya</span>
                </motion.button>

                <div className="flex items-center space-x-3">
                  {!isStepComplete && (
                    <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 px-4 py-2 rounded-xl">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">Lengkapi semua penilaian</span>
                    </div>
                  )}

                  {isStepComplete && (
                    <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-4 py-2 rounded-xl">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Langkah selesai</span>
                    </div>
                  )}

                  {currentStep < totalSteps - 1 ? (
                    <motion.button
                      type="button"
                      onClick={nextStep}
                      disabled={!isStepComplete}
                      whileHover={{ scale: isStepComplete ? 1.05 : 1 }}
                      whileTap={{ scale: isStepComplete ? 0.95 : 1 }}
                      className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <span>Selanjutnya</span>
                      <ChevronRight className="w-5 h-5" />
                    </motion.button>
                  ) : (
                    <motion.button
                      type="submit"
                      disabled={
                        !responses.every((r) => r.rating > 0) || isSubmitting
                      }
                      whileHover={{
                        scale: responses.every((r) => r.rating > 0) ? 1.05 : 1,
                      }}
                      whileTap={{
                        scale: responses.every((r) => r.rating > 0) ? 0.95 : 1,
                      }}
                      className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Mengirim...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>Kirim Penilaian</span>
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
}

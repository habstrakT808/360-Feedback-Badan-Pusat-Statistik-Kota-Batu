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
      aspectName: z.string(),
      description: z.string(),
      combinedIndicator: z.string(),
      rating: z
        .number()
        .min(71, "Rating minimal 71")
        .max(90, "Rating maksimal 90"),
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
      responses: ASSESSMENT_ASPECTS.map((aspect) => ({
        aspect: aspect.id,
        aspectName: aspect.name,
        description: aspect.description,
        combinedIndicator: aspect.combinedIndicator,
        rating: 0,
        comment: "",
      })),
    },
  });

  const responses = watch("responses");
  const currentAspect = ASSESSMENT_ASPECTS[currentStep];
  const totalSteps = ASSESSMENT_ASPECTS.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const currentResponse = responses[currentStep];
  const isStepComplete =
    typeof currentResponse?.rating === "number" &&
    currentResponse.rating >= 71 &&
    currentResponse.rating <= 90;
  const totalComplete = responses.filter(
    (r) => typeof r.rating === "number" && r.rating >= 71 && r.rating <= 90
  ).length;
  const totalQuestions = responses.length;

  const onSubmit = async (data: AssessmentForm) => {
    setIsSubmitting(true);
    try {
      // Transform data to match the expected format for backend
      const transformedResponses = data.responses.flatMap((response) => {
        const aspect = ASSESSMENT_ASPECTS.find((a) => a.id === response.aspect);
        if (!aspect) return [];

        return aspect.indicators.map((indicator) => ({
          aspect: response.aspect,
          indicator,
          rating: response.rating,
          comment: response.comment || "",
        }));
      });

      await AssessmentService.submitFeedback(
        assignment.id,
        transformedResponses
      );

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
              <div className="text-sm text-gray-600 mb-1">
                Langkah {currentStep + 1} dari {totalSteps}
              </div>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Progress {totalComplete}/{totalQuestions}
            </div>
            <div className="text-sm font-medium text-blue-600">
              {Math.round((totalComplete / totalQuestions) * 100)}% selesai
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
              </div>

              {/* Single Rating Section */}
              <div className="bg-gray-50 rounded-2xl p-8 hover:bg-gray-100 transition-colors">
                {/* Detailed Indicators */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 text-center">
                    Indikator Detail yang Dinilai:
                  </h4>
                  <div className="space-y-3">
                    {currentAspect.indicators.map((indicator, index) => (
                      <div
                        key={`${currentAspect.id}-indicator-${index}`}
                        className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {indicator}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center mb-6">
                  <Controller
                    control={control}
                    name={`responses.${currentStep}.rating`}
                    render={({ field }) => (
                      <RatingInput
                        value={field.value}
                        onChange={field.onChange}
                        max={10}
                        minValue={71}
                        maxValue={90}
                        size="lg"
                      />
                    )}
                  />
                </div>

                {typeof currentResponse?.rating === "number" && (
                  <div className="text-center text-sm mt-1">
                    {isStepComplete ? (
                      <span className="text-green-600 font-medium">
                        Rating: {currentResponse.rating}/90
                      </span>
                    ) : currentResponse.rating < 71 ||
                      currentResponse.rating > 90 ? (
                      <span className="text-red-600 font-medium">
                        Hanya bisa memasukkan angka dari 71-90
                      </span>
                    ) : null}
                  </div>
                )}

                {/* Comment Section */}
                <div className="mt-8">
                  <button
                    type="button"
                    onClick={() =>
                      setShowCommentFor(
                        showCommentFor === `step-${currentStep}`
                          ? null
                          : `step-${currentStep}`
                      )
                    }
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors mx-auto"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Tambah Komentar (Opsional)
                    </span>
                  </button>

                  <AnimatePresence>
                    {showCommentFor === `step-${currentStep}` && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4"
                      >
                        <Controller
                          control={control}
                          name={`responses.${currentStep}.comment`}
                          render={({ field }) => (
                            <textarea
                              {...field}
                              placeholder="Berikan komentar atau saran untuk perbaikan aspek ini..."
                              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                              rows={3}
                            />
                          )}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-8">
                <motion.button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  whileHover={{ scale: currentStep === 0 ? 1 : 1.05 }}
                  whileTap={{ scale: currentStep === 0 ? 1 : 0.95 }}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
                    currentStep === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </motion.button>

                {currentStep === totalSteps - 1 ? (
                  <motion.button
                    type="submit"
                    disabled={!isStepComplete || isSubmitting}
                    whileHover={{
                      scale: isStepComplete && !isSubmitting ? 1.05 : 1,
                    }}
                    whileTap={{
                      scale: isStepComplete && !isSubmitting ? 0.95 : 1,
                    }}
                    className={`flex items-center space-x-2 px-8 py-3 rounded-xl font-medium transition-all ${
                      isStepComplete && !isSubmitting
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Mengirim...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Assessment</span>
                      </>
                    )}
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    onClick={nextStep}
                    disabled={!isStepComplete}
                    whileHover={{ scale: isStepComplete ? 1.05 : 1 }}
                    whileTap={{ scale: isStepComplete ? 0.95 : 1 }}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
                      isStepComplete
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <span>Selanjutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
}

// src/components/results/AspectCard.tsx
"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ASSESSMENT_ASPECTS } from "@/lib/assessment-data";

interface FeedbackDetail {
  indicator: string;
  rating: number;
  comment?: string;
}

interface AspectCardProps {
  aspect: {
    name: string;
    id: string;
    averageRating: number;
    totalFeedback: number;
    feedbackDetails: FeedbackDetail[];
    color: string;
    icon: string;
  };
}

const aspectIcons = {
  kolaboratif: "🤝",
  adaptif: "🔄",
  loyal: "🛡️",
  harmonis: "🕊️",
  kompeten: "🎯",
  akuntabel: "✅",
  berorientasi_pelayanan: "🌟",
};

const aspectColors = {
  kolaboratif: "from-blue-500 to-blue-600",
  adaptif: "from-green-500 to-green-600",
  loyal: "from-red-500 to-red-600",
  harmonis: "from-purple-500 to-purple-600",
  kompeten: "from-yellow-500 to-yellow-600",
  akuntabel: "from-indigo-500 to-indigo-600",
  berorientasi_pelayanan: "from-pink-500 to-pink-600",
};

export function AspectCard({ aspect }: AspectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get aspect details from ASSESSMENT_ASPECTS
  const aspectDetails = ASSESSMENT_ASPECTS.find((a) => a.id === aspect.id);

  const getRatingText = (rating: number) => {
    if (rating >= 9)
      return { text: "Luar Biasa", color: "text-green-600", bg: "bg-green-50" };
    if (rating >= 8)
      return { text: "Sangat Baik", color: "text-blue-600", bg: "bg-blue-50" };
    if (rating >= 7)
      return { text: "Baik", color: "text-indigo-600", bg: "bg-indigo-50" };
    if (rating >= 6)
      return {
        text: "Cukup Baik",
        color: "text-yellow-600",
        bg: "bg-yellow-50",
      };
    if (rating >= 5)
      return { text: "Cukup", color: "text-orange-600", bg: "bg-orange-50" };
    return { text: "Perlu Perbaikan", color: "text-red-600", bg: "bg-red-50" };
  };

  const ratingInfo = getRatingText(aspect.averageRating);
  const gradientClass =
    aspectColors[aspect.id as keyof typeof aspectColors] ||
    "from-gray-500 to-gray-600";

  const getTrendIcon = (rating: number) => {
    if (rating >= 7) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (rating >= 5) return <Minus className="w-4 h-4 text-yellow-500" />;
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${gradientClass} p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">
              {aspectIcons[aspect.id as keyof typeof aspectIcons] || "📊"}
            </div>
            <div>
              <h3 className="text-xl font-bold">{aspect.name}</h3>
              <p className="text-white/80 text-sm">
                {aspect.totalFeedback} feedback diterima
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-bold">{aspect.averageRating}</div>
            <div className="text-white/80 text-sm">dari 90</div>
          </div>
        </div>

        {/* Aspect Description */}
        {aspectDetails && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-white/90 text-sm leading-relaxed">
              {aspectDetails.description}
            </p>
          </div>
        )}
      </div>

      {/* Rating Info */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${ratingInfo.bg} ${ratingInfo.color}`}
            >
              {ratingInfo.text}
            </div>
            {getTrendIcon(aspect.averageRating)}
          </div>
        </div>

        {/* Indikator (daftar sesuai aspek) */}
        {aspectDetails && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-3">Indikator:</h4>
            <div className="space-y-2">
              {aspectDetails.indicators.map((indicator, index) => (
                <div
                  key={`${aspect.id}-indicator-${index}`}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
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
        )}

        {/* Tidak menampilkan feedback per indikator */}
      </div>
    </motion.div>
  );
}

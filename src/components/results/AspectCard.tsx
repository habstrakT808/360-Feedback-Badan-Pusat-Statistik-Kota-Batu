// src/components/results/AspectCard.tsx
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

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
            <div className="text-3xl font-bold">
              {aspect.averageRating.toFixed(1)}
            </div>
            <div className="text-white/80 text-sm">dari 10.0</div>
          </div>
        </div>
      </div>

      {/* Rating Badge & Trend */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div
            className={`inline-flex items-center px-4 py-2 rounded-full ${ratingInfo.bg} ${ratingInfo.color} font-medium`}
          >
            <Star className="w-4 h-4 mr-2 fill-current" />
            {ratingInfo.text}
          </div>
          <div className="flex items-center space-x-2">
            {getTrendIcon(aspect.averageRating)}
            <span className="text-sm text-gray-600">Trend</span>
          </div>
        </div>
      </div>

      {/* Expand Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-700">
          {isExpanded ? "Sembunyikan Detail" : "Lihat Detail Feedback"}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-gray-50 space-y-4">
              <h4 className="font-semibold text-gray-900 mb-4">
                Detail Feedback ({aspect.feedbackDetails.length})
              </h4>

              {aspect.feedbackDetails.map((detail, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-4 border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-gray-800 font-medium text-sm leading-relaxed">
                        {detail.indicator}
                      </p>
                    </div>
                    <div className="ml-4 flex items-center space-x-2">
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-bold ${
                          detail.rating >= 8
                            ? "bg-green-100 text-green-700"
                            : detail.rating >= 6
                            ? "bg-blue-100 text-blue-700"
                            : detail.rating >= 4
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {detail.rating}/10
                      </div>
                    </div>
                  </div>

                  {detail.comment && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-400">
                      <p className="text-gray-700 text-sm italic">
                        "{detail.comment}"
                      </p>
                    </div>
                  )}

                  {/* Rating Bar */}
                  <div className="mt-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            detail.rating >= 8
                              ? "bg-green-500"
                              : detail.rating >= 6
                              ? "bg-blue-500"
                              : detail.rating >= 4
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${(detail.rating / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8">
                        {detail.rating}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Summary Stats */}
              <div className="mt-6 p-4 bg-white rounded-xl border border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {
                        aspect.feedbackDetails.filter((f) => f.rating >= 8)
                          .length
                      }
                    </div>
                    <div className="text-xs text-gray-600">Sangat Baik</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {
                        aspect.feedbackDetails.filter(
                          (f) => f.rating >= 5 && f.rating < 8
                        ).length
                      }
                    </div>
                    <div className="text-xs text-gray-600">Cukup</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {
                        aspect.feedbackDetails.filter((f) => f.rating < 5)
                          .length
                      }
                    </div>
                    <div className="text-xs text-gray-600">Perlu Perbaikan</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

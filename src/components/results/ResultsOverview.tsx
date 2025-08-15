// src/components/results/ResultsOverview.tsx
"use client";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  Award,
  MessageSquare,
  Star,
  Target,
  Zap,
} from "lucide-react";
import { CircularProgress } from "@/components/charts/CircularProgress";

interface ResultsOverviewProps {
  data: {
    overallRating: number;
    totalFeedback: number;
    aspectResults: any[];
    comments: any[];
  } | null;
}

export function ResultsOverview({ data }: ResultsOverviewProps) {
  // Handle case where data is null or undefined
  if (!data) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Data Hasil Belum Tersedia
          </h3>
          <p className="text-gray-600">
            Hasil penilaian akan ditampilkan setelah data tersedia
          </p>
        </div>
      </div>
    );
  }

  const { overallRating, totalFeedback, aspectResults, comments } = data;

  const getRatingText = (rating: number) => {
    if (rating >= 9)
      return {
        text: "Luar Biasa",
        color: "text-green-600",
        bg: "bg-green-100",
      };
    if (rating >= 8)
      return { text: "Sangat Baik", color: "text-blue-600", bg: "bg-blue-100" };
    if (rating >= 7)
      return { text: "Baik", color: "text-indigo-600", bg: "bg-indigo-100" };
    if (rating >= 6)
      return {
        text: "Cukup Baik",
        color: "text-yellow-600",
        bg: "bg-yellow-100",
      };
    if (rating >= 5)
      return { text: "Cukup", color: "text-orange-600", bg: "bg-orange-100" };
    return { text: "Perlu Perbaikan", color: "text-red-600", bg: "bg-red-100" };
  };

  const ratingInfo = getRatingText(overallRating);

  const topAspects = aspectResults
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  const bottomAspects = aspectResults
    .sort((a, b) => a.rating - b.rating)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Skor Keseluruhan</h2>
            <div className="flex items-center space-x-4">
              <div className="text-4xl font-bold">
                {overallRating.toFixed(1)}
              </div>
              <div className="text-right">
                <div className="text-sm opacity-90">dari 10.0</div>
                <div
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${ratingInfo.bg} ${ratingInfo.color}`}
                >
                  {ratingInfo.text}
                </div>
              </div>
            </div>
          </div>
          <CircularProgress
            value={overallRating}
            maxValue={10}
            color="white"
            size={100}
          />
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Feedback
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {totalFeedback}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-xl">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Komentar</p>
              <p className="text-2xl font-bold text-gray-900">
                {comments.length}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aspek Dinilai</p>
              <p className="text-2xl font-bold text-gray-900">
                {aspectResults.length}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top & Bottom Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strengths */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-bold text-gray-900">Kekuatan Utama</h3>
          </div>
          <div className="space-y-3">
            {topAspects.map((aspect, index) => (
              <div
                key={aspect.aspectId}
                className="flex items-center justify-between"
              >
                <span className="text-gray-700">{aspect.aspect}</span>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="font-semibold text-green-600">
                      {aspect.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Areas for Improvement */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Target className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-bold text-gray-900">
              Area Pengembangan
            </h3>
          </div>
          <div className="space-y-3">
            {bottomAspects.map((aspect, index) => (
              <div
                key={aspect.aspectId}
                className="flex items-center justify-between"
              >
                <span className="text-gray-700">{aspect.aspect}</span>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="font-semibold text-orange-600">
                      {aspect.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

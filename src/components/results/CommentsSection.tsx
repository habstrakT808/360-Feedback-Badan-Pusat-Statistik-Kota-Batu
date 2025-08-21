// src/components/results/CommentsSection.tsx
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Filter, Search, Quote } from "lucide-react";
import { ASSESSMENT_ASPECTS } from "@/lib/assessment-data";

interface CommentsSectionProps {
  comments: Array<{
    comment: string;
    aspect: string;
    rating: number;
  }>;
}

export function CommentsSection({ comments }: CommentsSectionProps) {
  const [selectedAspect, setSelectedAspect] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredComments = comments.filter((comment) => {
    const matchesAspect =
      selectedAspect === "all" || comment.aspect === selectedAspect;
    const matchesSearch = comment.comment
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesAspect && matchesSearch;
  });

  const getAspectName = (aspectId: string) => {
    const aspect = ASSESSMENT_ASPECTS.find((a) => a.id === aspectId);
    return aspect?.name || aspectId;
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "bg-green-100 text-green-800";
    if (rating >= 6) return "bg-blue-100 text-blue-800";
    if (rating >= 4) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
    >
      <div className="flex items-center space-x-2 mb-6">
        <MessageSquare className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">
          Komentar & Saran ({comments.length})
        </h2>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari dalam komentar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedAspect}
            onChange={(e) => setSelectedAspect(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Semua Aspek</option>
            {ASSESSMENT_ASPECTS.map((aspect) => (
              <option key={aspect.id} value={aspect.id}>
                {aspect.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
        <AnimatePresence>
          {filteredComments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-gray-500"
            >
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Tidak ada komentar yang ditemukan</p>
            </motion.div>
          ) : (
            filteredComments.map((comment, index) => (
              <motion.div
                key={`${comment.aspect}-${comment.rating}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-blue-600">
                      {getAspectName(comment.aspect)}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getRatingColor(
                        comment.rating
                      )}`}
                    >
                      {comment.rating}/10
                    </span>
                  </div>
                  <Quote className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {comment.comment}
                </p>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

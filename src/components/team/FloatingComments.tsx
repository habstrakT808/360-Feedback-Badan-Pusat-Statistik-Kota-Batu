// src/components/team/FloatingComments.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Star, Sparkles } from "lucide-react";

interface Comment {
  id: string;
  comment: string;
  aspect: string;
  created_at: string;
}

interface FloatingCommentsProps {
  userId: string;
  periodId?: string;
}

export function FloatingComments({ userId, periodId }: FloatingCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");

  useEffect(() => {
    loadComments();
  }, [userId, selectedPeriod]);

  const loadComments = async () => {
    try {
      setIsLoading(true);

      let query = supabase
        .from("feedback_responses")
        .select(
          `
           id,
           comment,
           aspect,
           created_at,
           assignment:assessment_assignments!inner(
             id,
             period_id,
             assessor_id
           )
         `
        )
        .eq("assignment.assessee_id", userId)
        .not("comment", "is", null)
        .neq("comment", "")
        .order("created_at", { ascending: false });

      if (selectedPeriod !== "all" && selectedPeriod) {
        query = query.eq("assignment.period_id", selectedPeriod);
      }

      const { data, error } = await query;

      if (error) throw error;

      const seenKeys = new Set<string>();
      const processedComments: Comment[] = (data || [])
        .filter((item: any) => {
          if (!item || !item.comment) return false;
          const aspectId = item.aspect as string;
          const assessorId = item?.assignment?.assessor_id || "unknown";
          const dedupeKey = `${assessorId}:${aspectId}`;

          if (seenKeys.has(dedupeKey)) return false;
          seenKeys.add(dedupeKey);
          return true;
        })
        .map((item: any) => ({
          id: item.id,
          comment: item.comment,
          aspect: item.aspect,
          created_at: item.created_at,
        }));

      setComments(processedComments);
      console.log(
        "Loaded comments:",
        processedComments.length,
        processedComments
      );
    } catch (error) {
      console.error("Error loading comments:", error);
      // Set mock data for demo
      setComments([
        {
          id: "1",
          comment:
            "Sangat komunikatif dan selalu membantu tim dalam menyelesaikan masalah dengan pendekatan yang kreatif.",
          aspect: "Komunikasi",
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          comment:
            "Menunjukkan leadership yang luar biasa dalam project terakhir. Mampu memotivasi seluruh tim.",
          aspect: "Leadership",
          created_at: new Date().toISOString(),
        },
        {
          id: "3",
          comment:
            "Selalu proaktif dalam memberikan solusi inovatif. Thinking outside the box!",
          aspect: "Inovasi",
          created_at: new Date().toISOString(),
        },
        {
          id: "4",
          comment:
            "Kerja sama tim yang excellent. Selalu mendukung rekan kerja dan berbagi knowledge.",
          aspect: "Kolaborasi",
          created_at: new Date().toISOString(),
        },
        {
          id: "5",
          comment:
            "Problem solving skills yang amazing! Selalu menemukan jalan keluar dari situasi sulit.",
          aspect: "Problem Solving",
          created_at: new Date().toISOString(),
        },
        {
          id: "6",
          comment: "Sangat detail oriented dan teliti dalam setiap pekerjaan.",
          aspect: "Ketelitian",
          created_at: new Date().toISOString(),
        },
        {
          id: "7",
          comment: "Mampu bekerja under pressure dengan hasil yang memuaskan.",
          aspect: "Resiliensi",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate responsive card size based on number of comments
  const getCardSize = (totalComments: number) => {
    if (totalComments <= 3) return { width: 280, height: 120 };
    if (totalComments <= 5) return { width: 250, height: 110 };
    if (totalComments <= 8) return { width: 220, height: 100 };
    if (totalComments <= 12) return { width: 200, height: 90 };
    return { width: 180, height: 80 };
  };

  // Generate non-overlapping positions using percentage-based grid layout
  const generatePositions = (
    count: number,
    cardSize: { width: number; height: number }
  ) => {
    const positions: Array<{ x: number; y: number }> = [];

    // Use grid layout to ensure no overlap
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);

    // Calculate spacing using percentages for better distribution
    const cellWidthPercent = 80 / cols; // 80% of container width divided by cols
    const cellHeightPercent = 70 / rows; // 70% of container height divided by rows

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      // Calculate position as percentage with margins
      const x = 10 + col * cellWidthPercent + cellWidthPercent / 2;
      const y = 15 + row * cellHeightPercent + cellHeightPercent / 2;

      positions.push({ x, y });
    }

    return positions;
  };

  if (isLoading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Memuat komentar...</p>
        </div>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center">
          <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-500 mb-2">
            Belum Ada Komentar
          </h3>
          <p className="text-gray-400">
            Komentar dari feedback akan muncul di sini
          </p>
        </div>
      </div>
    );
  }

  const cardSize = getCardSize(comments.length);
  const positions = generatePositions(comments.length, cardSize);
  console.log("Generated positions:", positions.length, positions);

  return (
    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg"
        >
          <Sparkles className="w-6 h-6 text-purple-600" />
          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Komentar & Apresiasi
          </h3>
          <Sparkles className="w-6 h-6 text-purple-600" />
        </motion.div>
      </div>

      {/* Responsive Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {comments.map((comment, index) => (
          <motion.div
            key={comment.id}
            initial={{
              opacity: 0,
              scale: 0.3,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              delay: index * 0.1,
              duration: 0.6,
              ease: "easeOut",
            }}
            whileHover={{
              scale: 1.02,
              transition: { duration: 0.2 },
            }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-white/20 transition-all duration-300 group cursor-pointer min-h-[120px] flex flex-col"
          >
            {/* Aspect Badge */}
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                {comment.aspect}
              </span>
              <span className="text-gray-400 text-xs">
                {new Date(comment.created_at).toLocaleDateString("id-ID", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            {/* Comment Content */}
            <div className="text-gray-700 leading-tight font-medium flex-1 text-sm">
              "
              {comment.comment.length > 100
                ? comment.comment.substring(0, 100) + "..."
                : comment.comment}
              "
            </div>

            {/* Hover Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

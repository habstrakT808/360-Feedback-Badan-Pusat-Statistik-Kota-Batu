// src/app/my-results/page.tsx
"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AspectCard } from "@/components/results/AspectCard";
import { Loading } from "@/components/ui/Loading";
import { ResultsService } from "@/lib/results-service";
import { useStore } from "@/store/useStore";
import { toast } from "react-hot-toast";
import {
  Trophy,
  AlertCircle,
  Award,
  Users,
  Calendar,
  TrendingUp,
} from "lucide-react";

const ASPECT_NAMES = {
  kolaboratif: "Kolaboratif",
  adaptif: "Adaptif",
  loyal: "Loyal",
  harmonis: "Harmonis",
  kompeten: "Kompeten",
  akuntabel: "Akuntabel",
  berorientasi_pelayanan: "Berorientasi Pelayanan",
};

export default function MyResultsPage() {
  const { user } = useStore();
  const [results, setResults] = useState<any[]>([]);
  const [processedData, setProcessedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadResults();
    }
  }, [user]);

  const loadResults = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      const data = await ResultsService.getMyResults(user.id);

      if (data && data.length > 0) {
        setResults(data);
        const processed = processResultsData(data);
        setProcessedData(processed);
      } else {
        setResults([]);
        setProcessedData(null);
      }
    } catch (error: any) {
      console.error("Error loading results:", error);
      toast.error("Gagal memuat hasil penilaian: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const processResultsData = (rawData: any[]) => {
    // Group by aspect
    const aspectGroups = rawData.reduce((groups, item) => {
      if (!groups[item.aspect]) {
        groups[item.aspect] = [];
      }
      groups[item.aspect].push(item);
      return groups;
    }, {});

    // Process each aspect
    const aspectResults = Object.entries(aspectGroups).map(
      ([aspectId, items]: [string, any]) => {
        const totalRating = items.reduce(
          (sum: number, item: any) => sum + item.rating,
          0
        );
        const averageRating = totalRating / items.length;

        const feedbackDetails = items.map((item: any) => ({
          indicator: item.indicator,
          rating: item.rating,
          comment: item.comment,
        }));

        return {
          id: aspectId,
          name: ASPECT_NAMES[aspectId as keyof typeof ASPECT_NAMES] || aspectId,
          averageRating: Math.round(averageRating * 10) / 10,
          totalFeedback: items.length,
          feedbackDetails: feedbackDetails,
          color: getAspectColor(aspectId),
        };
      }
    );

    // Calculate overall stats
    const totalRating = rawData.reduce((sum, item) => sum + item.rating, 0);
    const overallRating = totalRating / rawData.length;

    // Get period info
    const periodInfo = rawData[0]?.assignment?.period;

    return {
      aspectResults: aspectResults.sort(
        (a, b) => b.averageRating - a.averageRating
      ),
      overallRating: Math.round(overallRating * 10) / 10,
      totalFeedback: rawData.length,
      totalAspects: aspectResults.length,
      periodInfo,
    };
  };

  const getAspectColor = (aspectId: string) => {
    const colors = {
      kolaboratif: "blue",
      adaptif: "green",
      loyal: "red",
      harmonis: "purple",
      kompeten: "yellow",
      akuntabel: "indigo",
      berorientasi_pelayanan: "pink",
    };
    return colors[aspectId as keyof typeof colors] || "gray";
  };

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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-20">
          <Loading size="lg" text="Memuat hasil penilaian..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Hasil Penilaian Saya
              </h1>
              <p className="text-gray-600 text-lg">
                Hasil penilaian 360° dari rekan kerja Anda
              </p>
            </div>
          </div>

          {processedData?.periodInfo && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>
                Periode:{" "}
                {new Date(0, processedData.periodInfo.month - 1).toLocaleString(
                  "id-ID",
                  { month: "long" }
                )}{" "}
                {processedData.periodInfo.year}
              </span>
            </div>
          )}
        </motion.div>

        {results.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-32 h-32 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <Trophy className="w-16 h-16 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Belum Ada Hasil Penilaian
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
              Anda belum menerima feedback dari rekan kerja. Hasil akan muncul
              setelah ada data penilaian yang tersedia.
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <AlertCircle className="w-5 h-5" />
              <span>Hubungi admin jika Anda merasa ini adalah kesalahan</span>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Overall Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-3xl p-8 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>

              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">
                      Ringkasan Keseluruhan
                    </h2>
                    <p className="text-white/80">
                      Performa Anda berdasarkan penilaian 360°
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-bold mb-2">
                      {processedData?.overallRating?.toFixed(1) || "0.0"}
                    </div>
                    <div className="text-white/80">dari 10.0</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="text-2xl font-bold">
                      {processedData?.totalFeedback || 0}
                    </div>
                    <div className="text-white/80 text-sm">Total Feedback</div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Award className="w-6 h-6" />
                    </div>
                    <div className="text-2xl font-bold">
                      {processedData?.totalAspects || 0}
                    </div>
                    <div className="text-white/80 text-sm">Aspek Dinilai</div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div className="text-2xl font-bold">
                      {processedData
                        ? Math.round((processedData.overallRating / 10) * 100)
                        : 0}
                      %
                    </div>
                    <div className="text-white/80 text-sm">Skor Persentase</div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div
                      className={`text-sm font-medium px-3 py-1 rounded-full bg-white/20`}
                    >
                      {processedData
                        ? getRatingText(processedData.overallRating).text
                        : "N/A"}
                    </div>
                    <div className="text-white/80 text-sm mt-1">Kategori</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Aspects Grid */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Hasil per Aspek Penilaian
                </h2>
                <p className="text-gray-600">
                  Klik pada setiap aspek untuk melihat detail feedback yang Anda
                  terima
                </p>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {processedData?.aspectResults?.map(
                  (aspect: any, index: number) => (
                    <motion.div
                      key={aspect.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      <AspectCard aspect={aspect} />
                    </motion.div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

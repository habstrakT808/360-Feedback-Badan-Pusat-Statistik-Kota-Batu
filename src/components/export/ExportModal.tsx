// src/components/export/ExportModal.tsx
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  FileText,
  Table,
  Image,
  File,
  Calendar,
  Users,
  User,
  BarChart3,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { ExportService } from "@/lib/export-service";
import { toast } from "react-hot-toast";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  type: "individual" | "team" | "summary";
  title: string;
}

export function ExportModal({
  isOpen,
  onClose,
  data,
  type,
  title,
}: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<
    "pdf" | "excel" | "csv" | "png"
  >("pdf");
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeComments, setIncludeComments] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const exportFormats = [
    {
      id: "pdf",
      name: "PDF Report",
      description: "Comprehensive report with charts and formatting",
      icon: FileText,
      color: "bg-red-100 text-red-600",
      recommended: true,
    },
    {
      id: "excel",
      name: "Excel Spreadsheet",
      description: "Data in Excel format for further analysis",
      icon: Table,
      color: "bg-green-100 text-green-600",
      recommended: false,
    },
    {
      id: "csv",
      name: "CSV File",
      description: "Raw data in CSV format",
      icon: File,
      color: "bg-blue-100 text-blue-600",
      recommended: false,
    },
    {
      id: "png",
      name: "Chart Images",
      description: "Export charts as PNG images",
      icon: Image,
      color: "bg-purple-100 text-purple-600",
      recommended: false,
    },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress((prev) => Math.min(prev + 20, 90));
      }, 200);

      if (selectedFormat === "pdf") {
        await ExportService.exportToPDF(data, type, title);
      } else if (selectedFormat === "excel") {
        ExportService.exportToExcel(data, type, title);
      } else if (selectedFormat === "csv") {
        const headers =
          type === "team"
            ? [
                "full_name",
                "position",
                "department",
                "averageRating",
                "totalFeedback",
              ]
            : ["aspect", "rating", "comment"];
        const csvData = type === "team" ? data : data.aspectResults || [];
        ExportService.exportToCSV(csvData, title, headers);
      } else if (selectedFormat === "png") {
        // Export charts as PNG
        await ExportService.exportChartAsPNG("performance-chart", title);
      }

      clearInterval(progressInterval);
      setExportProgress(100);

      setTimeout(() => {
        toast.success("Export berhasil! File telah diunduh.");
        onClose();
      }, 500);
    } catch (error: any) {
      toast.error("Export gagal: " + error.message);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <Download className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Export Data
                    </h2>
                    <p className="text-gray-600 text-sm">{title}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto custom-scrollbar">
                {/* Export Format Selection */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Pilih Format Export
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {exportFormats.map((format) => (
                      <motion.button
                        key={format.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedFormat(format.id as any)}
                        className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                          selectedFormat === format.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${format.color}`}>
                            <format.icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-gray-900">
                                {format.name}
                              </h4>
                              {format.recommended && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                  Recommended
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {format.description}
                            </p>
                          </div>
                        </div>

                        {selectedFormat === format.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2"
                          >
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Export Options */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Opsi Export
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={includeCharts}
                        onChange={(e) => setIncludeCharts(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">
                          Sertakan grafik dan visualisasi
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={includeComments}
                        onChange={(e) => setIncludeComments(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">
                          Sertakan komentar dan feedback
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={includeDetails}
                        onChange={(e) => setIncludeDetails(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">
                          Sertakan detail per aspek
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Export Preview */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Preview Export
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {type === "individual" ? (
                          <User className="w-4 h-4 text-blue-600" />
                        ) : type === "team" ? (
                          <Users className="w-4 h-4 text-blue-600" />
                        ) : (
                          <BarChart3 className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{title}</h4>
                        <p className="text-sm text-gray-600">
                          {type === "individual"
                            ? "Individual Report"
                            : type === "team"
                            ? "Team Report"
                            : "Summary Report"}
                        </p>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Generated: {new Date().toLocaleDateString("id-ID")}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <File className="w-3 h-3" />
                        <span>Format: {selectedFormat.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {isExporting && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Exporting...
                      </span>
                      <span className="text-sm text-gray-500">
                        {exportProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${exportProgress}%` }}
                        className="bg-blue-600 h-2 rounded-full"
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                <button
                  onClick={onClose}
                  disabled={isExporting}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <motion.button
                  whileHover={{ scale: isExporting ? 1 : 1.05 }}
                  whileTap={{ scale: isExporting ? 1 : 0.95 }}
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Export Sekarang</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// src/components/export/ExportButton.tsx
"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, ChevronDown } from "lucide-react";
import { ExportModal } from "./ExportModal";

interface ExportButtonProps {
  data: any;
  type: "individual" | "team" | "summary";
  title: string;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
}

export function ExportButton({
  data,
  type,
  title,
  variant = "primary",
  size = "md",
}: ExportButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [showQuickOptions, setShowQuickOptions] = useState(false);

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };

  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
  };

  const quickExportOptions = [
    { label: "Export PDF", action: () => handleQuickExport("pdf") },
    { label: "Export Excel", action: () => handleQuickExport("excel") },
    { label: "Export CSV", action: () => handleQuickExport("csv") },
  ];

  const handleQuickExport = async (format: "pdf" | "excel" | "csv") => {
    const { ExportService } = await import("@/lib/export-service");

    try {
      if (format === "pdf") {
        await ExportService.exportToPDF(data, type, title);
      } else if (format === "excel") {
        ExportService.exportToExcel(data, type, title);
      } else if (format === "csv") {
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
      }
    } catch (error) {
      console.error("Export failed:", error);
    }

    setShowQuickOptions(false);
  };

  return (
    <>
      <div className="relative">
        {/* Main Export Button */}
        <div className="flex">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className={`flex items-center space-x-2 ${sizeClasses[size]} ${variantClasses[variant]} rounded-l-xl transition-colors`}
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </motion.button>

          {/* Dropdown Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowQuickOptions(!showQuickOptions)}
            className={`px-2 ${variantClasses[variant]} rounded-r-xl border-l border-white/20 transition-colors`}
          >
            <ChevronDown
              className={`w-4 h-4 transform transition-transform ${
                showQuickOptions ? "rotate-180" : ""
              }`}
            />
          </motion.button>
        </div>

        {/* Quick Options Dropdown */}
        {showQuickOptions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10 min-w-[160px]"
          >
            {quickExportOptions.map((option, index) => (
              <button
                key={index}
                onClick={option.action}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {option.label}
              </button>
            ))}
            <hr className="my-2" />
            <button
              onClick={() => {
                setShowModal(true);
                setShowQuickOptions(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 transition-colors font-medium"
            >
              More Options...
            </button>
          </motion.div>
        )}
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        data={data}
        type={type}
        title={title}
      />
    </>
  );
}

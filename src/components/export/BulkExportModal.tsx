// src/components/export/BulkExportModal.tsx
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  Users,
  Calendar,
  CheckSquare,
  Square,
  Loader2,
} from "lucide-react";
import { ExportService } from "@/lib/export-service";
import { toast } from "react-hot-toast";

interface BulkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamData: any[];
  periods: any[];
}

export function BulkExportModal({
  isOpen,
  onClose,
  teamData,
  periods,
}: BulkExportModalProps) {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel">("excel");
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const toggleAllEmployees = () => {
    if (selectedEmployees.length === teamData.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(teamData.map((emp) => emp.employee?.id || emp.id));
    }
  };

  const handleBulkExport = async () => {
    if (selectedEmployees.length === 0) {
      toast.error("Pilih minimal satu karyawan");
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      const selectedData = teamData.filter((emp) =>
        selectedEmployees.includes(emp.employee?.id || emp.id)
      );

      // Simulate progress
      for (let i = 0; i <= 100; i += 10) {
        setExportProgress(i);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (exportFormat === "excel") {
        ExportService.exportToExcel(selectedData, "team", "Bulk Team Export");
      } else {
        await ExportService.exportToPDF(
          selectedData,
          "team",
          "Bulk Team Export"
        );
      }

      toast.success("Bulk export berhasil!");
      onClose();
    } catch (error: any) {
      toast.error("Bulk export gagal: " + error.message);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-xl">
                    <Download className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Bulk Export
                    </h2>
                    <p className="text-gray-600 text-sm">
                      Export data untuk multiple karyawan
                    </p>
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
              <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto custom-scrollbar">
                {/* Employee Selection */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Pilih Karyawan ({selectedEmployees.length}/
                      {teamData.length})
                    </h3>
                    <button
                      onClick={toggleAllEmployees}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {selectedEmployees.length === teamData.length ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">
                        {selectedEmployees.length === teamData.length
                          ? "Unselect All"
                          : "Select All"}
                      </span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                    {teamData.map((emp) => (
                      <label
                        key={emp.employee?.id || emp.id}
                        className="flex items-center space-x-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(
                            emp.employee?.id || emp.id
                          )}
                          onChange={() =>
                            toggleEmployee(emp.employee?.id || emp.id)
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {emp.employee?.full_name || emp.full_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {emp.employee?.position || emp.position}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Format Selection */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Format Export
                  </h3>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-3 p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="format"
                        value="excel"
                        checked={exportFormat === "excel"}
                        onChange={(e) =>
                          setExportFormat(e.target.value as "excel")
                        }
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          Excel Spreadsheet
                        </p>
                        <p className="text-sm text-gray-600">
                          Best for data analysis
                        </p>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3 p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="format"
                        value="pdf"
                        checked={exportFormat === "pdf"}
                        onChange={(e) =>
                          setExportFormat(e.target.value as "pdf")
                        }
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <p className="font-medium text-gray-900">PDF Report</p>
                        <p className="text-sm text-gray-600">
                          Best for presentation
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Progress */}
                {isExporting && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Exporting {selectedEmployees.length} employees...
                      </span>
                      <span className="text-sm text-gray-500">
                        {exportProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${exportProgress}%` }}
                        className="bg-purple-600 h-2 rounded-full"
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  {selectedEmployees.length} karyawan dipilih
                </div>
                <div className="flex items-center space-x-3">
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
                    onClick={handleBulkExport}
                    disabled={isExporting || selectedEmployees.length === 0}
                    className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-2 rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Exporting...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Export ({selectedEmployees.length})</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

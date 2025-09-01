// src/components/export/AdminExportModal.tsx
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  Calendar,
  Users,
  User,
  BarChart3,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Filter,
  Database,
} from "lucide-react";
import { AdminExportService } from "@/lib/admin-export-service";
import { toast } from "react-hot-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/lib/supabase";

interface AdminExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Period {
  id: string;
  month: number;
  year: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface ExportOptions {
  dataType: "assessments" | "pins" | "triwulan";
  periodFilter: "specific" | "all";
  startDate?: string;
  endDate?: string;
  selectedPeriod?: string;
  format: "excel";
  includeUserDetails: boolean;
  includePeriodDetails: boolean;
}

const monthNames = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function AdminExportModal({ isOpen, onClose }: AdminExportModalProps) {
  const { isAdmin, isSupervisor } = useUserRole();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    dataType: "assessments",
    periodFilter: "specific",
    format: "excel",
    includeUserDetails: true,
    includePeriodDetails: true,
  });

  // Check if user has permission - but don't return early to avoid hooks order issues
  const hasPermission = isAdmin || isSupervisor;

  console.log(
    "🔍 AdminExportModal: Permission check - IsAdmin:",
    isAdmin,
    "IsSupervisor:",
    isSupervisor,
    "HasPermission:",
    hasPermission
  );

  useEffect(() => {
    if (isOpen && hasPermission) {
      fetchPeriods();
    }
  }, [isOpen, hasPermission]);

  const fetchPeriods = async () => {
    try {
      const response = await fetch("/api/admin/periods", {
        headers: {
          Authorization: `Bearer ${
            (
              await supabase.auth.getSession()
            ).data.session?.access_token
          }`,
        },
      });
      const { data, error } = await response.json();
      if (error) throw error;
      setPeriods(data || []);
    } catch (error) {
      console.error("Error fetching periods:", error);
      toast.error("Gagal mengambil data periode");
    }
  };

  const handleExport = async () => {
    if (!exportOptions.dataType) {
      toast.error("Pilih jenis data yang akan diexport");
      return;
    }

    if (
      exportOptions.periodFilter === "specific" &&
      !exportOptions.selectedPeriod
    ) {
      toast.error("Pilih periode spesifik");
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await AdminExportService.exportData(exportOptions);

      clearInterval(progressInterval);
      setExportProgress(100);

      setTimeout(() => {
        toast.success("Export berhasil!");
        onClose();
      }, 500);
    } catch (error: any) {
      toast.error(`Export gagal: ${error.message}`);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const dataTypeOptions = [
    {
      id: "assessments",
      name: "Penilaian 360°",
      description:
        "Data penilaian 360 derajat dengan detail assessor, assessee, skor, dan komentar",
      icon: Users,
      color: "bg-blue-100 text-blue-600",
    },
    {
      id: "pins",
      name: "Employee of The Month (Pin)",
      description:
        "Data sistem pin dengan detail pemberi, penerima, dan periode",
      icon: CheckCircle,
      color: "bg-green-100 text-green-600",
    },
    {
      id: "triwulan",
      name: "Triwulan",
      description: "Data pemenang triwulan dengan skor dan periode",
      icon: BarChart3,
      color: "bg-purple-100 text-purple-600",
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && hasPermission && (
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-xl">
                    <Database className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Admin Export Data
                    </h2>
                    <p className="text-gray-600 text-sm">
                      Export data lengkap untuk admin dan supervisor
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
                {/* Data Type Selection */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Pilih Jenis Data
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {dataTypeOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() =>
                          setExportOptions((prev) => ({
                            ...prev,
                            dataType: option.id as any,
                          }))
                        }
                        className={`p-4 rounded-xl border-2 transition-all ${
                          exportOptions.dataType === option.id
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${option.color}`}>
                            <option.icon className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <h4 className="font-semibold text-gray-900">
                              {option.name}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {option.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Period Filter */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Filter Periode
                  </h3>
                  <div className="space-y-4">
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={exportOptions.periodFilter === "specific"}
                          onChange={() =>
                            setExportOptions((prev) => ({
                              ...prev,
                              periodFilter: "specific",
                            }))
                          }
                          className="text-purple-600"
                        />
                        <span>Periode Spesifik</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={exportOptions.periodFilter === "all"}
                          onChange={() =>
                            setExportOptions((prev) => ({
                              ...prev,
                              periodFilter: "all",
                            }))
                          }
                          className="text-purple-600"
                        />
                        <span>Semua Periode</span>
                      </label>
                    </div>

                    {exportOptions.periodFilter === "specific" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pilih Periode
                          </label>
                          <select
                            value={exportOptions.selectedPeriod || ""}
                            onChange={(e) =>
                              setExportOptions((prev) => ({
                                ...prev,
                                selectedPeriod: e.target.value,
                              }))
                            }
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="">Pilih periode...</option>
                            {periods.map((period) => (
                              <option key={period.id} value={period.id}>
                                {monthNames[period.month - 1]} {period.year}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Atau Range Tanggal
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="date"
                              value={exportOptions.startDate || ""}
                              onChange={(e) =>
                                setExportOptions((prev) => ({
                                  ...prev,
                                  startDate: e.target.value,
                                }))
                              }
                              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <input
                              type="date"
                              value={exportOptions.endDate || ""}
                              onChange={(e) =>
                                setExportOptions((prev) => ({
                                  ...prev,
                                  endDate: e.target.value,
                                }))
                              }
                              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Advanced Options */}
                <div className="mb-8">
                  <button
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                    <span className="font-medium">Opsi Lanjutan</span>
                    {showAdvancedOptions ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  <AnimatePresence>
                    {showAdvancedOptions && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                            <input
                              type="checkbox"
                              checked={exportOptions.includeUserDetails}
                              onChange={(e) =>
                                setExportOptions((prev) => ({
                                  ...prev,
                                  includeUserDetails: e.target.checked,
                                }))
                              }
                              className="text-purple-600"
                            />
                            <div>
                              <span className="font-medium">
                                Include User Details
                              </span>
                              <p className="text-sm text-gray-600">
                                Nama dan email user
                              </p>
                            </div>
                          </label>
                          <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                            <input
                              type="checkbox"
                              checked={exportOptions.includePeriodDetails}
                              onChange={(e) =>
                                setExportOptions((prev) => ({
                                  ...prev,
                                  includePeriodDetails: e.target.checked,
                                }))
                              }
                              className="text-purple-600"
                            />
                            <div>
                              <span className="font-medium">
                                Include Period Details
                              </span>
                              <p className="text-sm text-gray-600">
                                Detail periode assessment
                              </p>
                            </div>
                          </label>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Export Progress */}
                {isExporting && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Exporting data...
                      </span>
                      <span className="text-sm text-gray-500">
                        {exportProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${exportProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={onClose}
                    disabled={isExporting}
                    className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Exporting...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Export Data</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

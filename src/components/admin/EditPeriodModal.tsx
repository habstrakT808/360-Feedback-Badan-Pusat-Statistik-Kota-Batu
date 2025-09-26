// src/components/admin/EditPeriodModal.tsx
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Save,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { AdminService } from "@/lib/admin-service";
import { toast } from "react-hot-toast";

interface EditPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  period: any;
}

export function EditPeriodModal({
  isOpen,
  onClose,
  onSuccess,
  period,
}: EditPeriodModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [formData, setFormData] = useState({
    month: period?.month || 1,
    year: period?.year || new Date().getFullYear(),
    start_date: period?.start_date || "",
    end_date: period?.end_date || "",
    is_active: period?.is_active || false,
  });

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

  useEffect(() => {
    if (period) {
      setFormData({
        month: period.month,
        year: period.year,
        start_date: period.start_date,
        end_date: period.end_date,
        is_active: period.is_active,
      });
    }
  }, [period]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.start_date || !formData.end_date) {
      toast.error("Mohon isi tanggal mulai dan selesai");
      return;
    }

    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      toast.error("Tanggal selesai harus setelah tanggal mulai");
      return;
    }

    setIsLoading(true);
    try {
      await AdminService.updatePeriod(period.id, {
        month: formData.month,
        year: formData.year,
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_active: formData.is_active,
      });

      toast.success("Periode berhasil diperbarui!");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error("Gagal memperbarui periode: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompletePeriod = async () => {
    if (
      !confirm(
        "Apakah Anda yakin ingin menyelesaikan periode penilaian ini? Periode akan ditandai sebagai selesai dan tidak dapat diubah lagi."
      )
    ) {
      return;
    }

    setIsCompleting(true);
    try {
      // Mark all assignments as completed and complete the period
      await AdminService.completeAllAssignments(period.id);

      toast.success("Periode penilaian berhasil diselesaikan!");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error("Gagal menyelesaikan periode: " + error.message);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleMonthChange = (month: number) => {
    setFormData((prev) => ({ ...prev, month }));

    // Auto-calculate start and end dates for the selected month
    const startDate = new Date(formData.year, month - 1, 1);
    const endDate = new Date(formData.year, month, 0);

    setFormData((prev) => ({
      ...prev,
      month,
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
    }));
  };

  const handleYearChange = (year: number) => {
    setFormData((prev) => ({ ...prev, year }));

    // Recalculate dates with new year
    const startDate = new Date(year, formData.month - 1, 1);
    const endDate = new Date(year, formData.month, 0);

    setFormData((prev) => ({
      ...prev,
      year,
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
    }));
  };

  const isPeriodStarted = () => {
    if (!period?.start_date) return false;
    const startDate = new Date(period.start_date);
    const now = new Date();
    return now >= startDate;
  };

  const isPeriodCompleted = () => {
    if (!period?.end_date) return false;
    const endDate = new Date(period.end_date);
    const now = new Date();
    return now > endDate;
  };

  const canCompletePeriod = () => {
    return isPeriodStarted() && !isPeriodCompleted() && period?.is_active;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Edit Periode
                  </h2>
                  <p className="text-sm text-gray-600">
                    {monthNames[period?.month - 1]} {period?.year}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Month Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bulan
                </label>
                <select
                  value={formData.month}
                  onChange={(e) => handleMonthChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {monthNames.map((month, index) => (
                    <option key={index + 1} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tahun
                </label>
                <select
                  value={formData.year}
                  onChange={(e) => handleYearChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {Array.from(
                    { length: 5 },
                    (_, i) => new Date().getFullYear() + i
                  ).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      start_date: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      end_date: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        is_active: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Periode Aktif
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-7">
                  Centang untuk mengaktifkan periode ini sebagai periode penilaian aktif
                </p>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  disabled={isLoading || isCompleting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading || isCompleting}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan</span>
                    </>
                  )}
                </button>
              </div>

              {/* Complete Period Button */}
              {canCompletePeriod() && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCompletePeriod}
                    disabled={isCompleting}
                    className="w-full px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isCompleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Menyelesaikan...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Selesaikan Periode Sekarang</span>
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Tombol ini akan menyelesaikan periode secara instan dan
                    menampilkan hasil penilaian
                  </p>
                </div>
              )}
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

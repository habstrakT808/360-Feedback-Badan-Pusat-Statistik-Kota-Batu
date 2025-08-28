// src/components/admin/PinPeriodAdmin.tsx
"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Plus, Edit, Trash2 } from "lucide-react";
import { PinPeriodService } from "@/lib/pin-period-service";
import { toast } from "react-hot-toast";

export function PinPeriodAdmin() {
  const [periods, setPeriods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({
    start_date: "",
    end_date: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setIsLoading(true);
      const data = await PinPeriodService.list();
      setPeriods(data);
    } catch (e: any) {
      toast.error(e.message || "Gagal memuat pin periods");
    } finally {
      setIsLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      start_date: "",
      end_date: "",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    });
    setIsModalOpen(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      start_date: p.start_date?.slice(0, 10) || "",
      end_date: p.end_date?.slice(0, 10) || "",
      month: p.month || new Date().getMonth() + 1,
      year: p.year || new Date().getFullYear(),
    });
    setIsModalOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!form.start_date || !form.end_date) {
        toast.error("Isi tanggal mulai dan selesai");
        return;
      }
      if (new Date(form.start_date) >= new Date(form.end_date)) {
        toast.error("Tanggal selesai harus setelah tanggal mulai");
        return;
      }
      if (editing) {
        await PinPeriodService.update(editing.id, {
          start_date: form.start_date,
          end_date: form.end_date,
          month: form.month,
          year: form.year,
        } as any);
        toast.success("Pin period diperbarui");
      } else {
        await PinPeriodService.create({
          start_date: form.start_date,
          end_date: form.end_date,
          month: form.month,
          year: form.year,
        });
        toast.success("Pin period dibuat");
      }
      setIsModalOpen(false);
      setEditing(null);
      await load();
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan pin period");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus pin period ini?")) return;
    try {
      await PinPeriodService.remove(id);
      toast.success("Pin period dihapus");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Gagal menghapus pin period");
    }
  };

  // Removed seeding helpers per request

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pin Periods</h2>
          <p className="text-gray-600">Atur tanggal mulai dan selesai pin</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openCreate}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>New Pin Period</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="animate-pulse h-24 bg-gray-100 rounded-xl" />
        ) : periods.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Belum ada pin period
            </h3>
            <p className="text-gray-600 mb-6">Buat periode pin pertama Anda</p>
            <button
              onClick={openCreate}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {periods.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:bg-white hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-gray-900">
                      {p.month
                        ? new Date(0, p.month - 1).toLocaleString("id-ID", {
                            month: "long",
                          }) +
                          " " +
                          p.year
                        : "Custom Range"}
                    </h3>
                  </div>
                  {p.is_active && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-700 space-y-1 mb-4">
                  <div>
                    Mulai: <span className="font-medium">{p.start_date}</span>
                  </div>
                  <div>
                    Selesai: <span className="font-medium">{p.end_date}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEdit(p)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => remove(p.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {editing ? "Edit Pin Period" : "Buat Pin Period"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>
            <form onSubmit={submit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bulan
                </label>
                <select
                  value={form.month}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, month: Number(e.target.value) }))
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {new Date(0, m - 1).toLocaleString("id-ID", {
                        month: "long",
                      })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tahun
                </label>
                <select
                  value={form.year}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, year: Number(e.target.value) }))
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl"
                >
                  {Array.from(
                    { length: 5 },
                    (_, i) => new Date().getFullYear() + i
                  ).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, start_date: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, end_date: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl"
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

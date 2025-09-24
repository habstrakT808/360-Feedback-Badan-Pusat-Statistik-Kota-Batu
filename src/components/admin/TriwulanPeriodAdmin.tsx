// src/components/admin/TriwulanPeriodAdmin.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Plus, Edit, Trash2, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import { TriwulanPeriodService } from "@/lib/triwulan-period-service";
import { RolesService } from "@/lib/roles-service";
// Removed Prisma import in client component
import { useSession } from "next-auth/react";

export function TriwulanPeriodAdmin() {
  const { data: session } = useSession();
  const [periods, setPeriods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({
    year: new Date().getFullYear(),
    quarter: Math.floor(new Date().getMonth() / 3) + 1,
    start_date: "",
    end_date: "",
  });

  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [defRows, setDefRows] = useState<
    Array<{
      user_id: string;
      full_name: string;
      month: number;
      year: number;
      deficiency_hours: number;
    }>
  >([]);
  const [showDefDetails, setShowDefDetails] = useState(true);
  const monthsInQuarter = useMemo(() => {
    if (!selectedPeriodId) return [] as number[];
    const p = periods.find((x) => x.id === selectedPeriodId);
    if (!p) return [] as number[];
    const start = new Date(p.start_date);
    const end = new Date(p.end_date);
    const out: number[] = [];
    for (
      let d = new Date(start.getFullYear(), start.getMonth(), 1);
      d <= end;
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    ) {
      out.push(d.getMonth() + 1);
    }
    return out;
  }, [selectedPeriodId, periods]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setIsLoading(true);
      const data = await TriwulanPeriodService.list();
      setPeriods(data);
    } catch (e: any) {
      toast.error(e.message || "Gagal memuat triwulan periods");
    } finally {
      setIsLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      year: new Date().getFullYear(),
      quarter: Math.floor(new Date().getMonth() / 3) + 1,
      start_date: "",
      end_date: "",
    });
    setIsModalOpen(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      year: p.year,
      quarter: p.quarter,
      start_date: p.start_date?.slice(0, 10) || "",
      end_date: p.end_date?.slice(0, 10) || "",
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
      if (form.quarter < 1 || form.quarter > 4) {
        toast.error("Quarter harus 1-4");
        return;
      }
      if (editing) {
        await TriwulanPeriodService.update(editing.id, {
          year: form.year,
          quarter: form.quarter,
          start_date: form.start_date,
          end_date: form.end_date,
        } as any);
        toast.success("Triwulan period diperbarui");
      } else {
        await TriwulanPeriodService.create({
          year: form.year,
          quarter: form.quarter,
          start_date: form.start_date,
          end_date: form.end_date,
        });
        toast.success("Triwulan period dibuat");
      }
      setIsModalOpen(false);
      setEditing(null);
      await load();
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan triwulan period");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus triwulan period ini?")) return;
    try {
      await TriwulanPeriodService.remove(id);
      toast.success("Triwulan period dihapus");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Gagal menghapus triwulan period");
    }
  };

  const loadDeficiencies = async (periodId: string) => {
    setSelectedPeriodId(periodId);
    try {
      // load users via API to avoid Prisma in browser
      const resUsers = await fetch('/api/admin/users', { cache: 'no-store' });
      const jsonUsers = await resUsers.json().catch(() => ({ users: [] }));
      const users = Array.isArray(jsonUsers.users) ? jsonUsers.users.map((u: any) => ({ id: u.id, full_name: u.full_name })) : [];

      const { adminIds, supervisorIds } = await RolesService.getRoleUserIds();
      const restricted = new Set([
        ...(adminIds || []),
        ...(supervisorIds || []),
      ]);
      const filteredUsers = (users || []).filter(
        (u: any) => !restricted.has(u.id)
      );
      // load existing defs
      const existing = await TriwulanPeriodService.listMonthlyDeficiencies(
        periodId
      );
      const per = periods.find((p) => p.id === periodId);
      const start = new Date(per.start_date);
      const end = new Date(per.end_date);
      const months: Array<{ year: number; month: number }> = [];
      for (
        let d = new Date(start.getFullYear(), start.getMonth(), 1);
        d <= end;
        d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      ) {
        months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
      }
      const rows: Array<{
        user_id: string;
        full_name: string;
        month: number;
        year: number;
        deficiency_hours: number;
      }> = [];
      (filteredUsers || []).forEach((u: any) => {
        months.forEach((m) => {
          const found = existing.find(
            (e) =>
              e.user_id === u.id && e.year === m.year && e.month === m.month
          );
          rows.push({
            user_id: u.id,
            full_name: u.full_name,
            month: m.month,
            year: m.year,
            deficiency_hours: found?.deficiency_hours ?? 0,
          });
        });
      });
      setDefRows(rows);
      toast.success("Data Kekurangan Jam Kerja dimuat");
    } catch (e: any) {
      toast.error(e.message || "Gagal memuat data kekurangan jam kerja");
    }
  };

  const saveDeficiencies = async () => {
    if (!selectedPeriodId) return;
    try {
      const filledBy = session?.user && 'id' in session.user ? session.user.id as string : null;
      const payload = defRows.map((r) => ({
        period_id: selectedPeriodId,
        user_id: r.user_id,
        year: r.year,
        month: r.month,
        deficiency_hours: Math.max(0, Number(r.deficiency_hours) || 0),
        filled_by: filledBy,
      }));
      await TriwulanPeriodService.upsertMonthlyDeficiencies(payload);
      toast.success("Kekurangan Jam Kerja tersimpan");
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Triwulan Periods
            </h2>
            <p className="text-gray-600">
              Kelola perioda triwulan dan kekurangan jam kerja
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openCreate}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Triwulan</span>
          </motion.button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Periods list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {periods.map((p) => (
            <div key={p.id} className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">
                    {p.year} - Q{p.quarter}
                  </div>
                  <div className="text-sm text-gray-600">
                    {p.start_date?.slice(0, 10)} → {p.end_date?.slice(0, 10)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(p)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => remove(p.id)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => loadDeficiencies(p.id)}
                  className={`text-sm px-3 py-1.5 rounded-lg ${
                    selectedPeriodId === p.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  Kelola Kekurangan Jam Kerja
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Deficiency editor */}
        {selectedPeriodId && (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="font-semibold">
                  Input Kekurangan Jam Kerja
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDefDetails((v) => !v)}
                  className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-gray-700"
                >
                  {showDefDetails ? "Sembunyikan Detail" : "Tampilkan Detail"}
                </button>
                <button
                  onClick={saveDeficiencies}
                  className="inline-flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700"
                >
                  <Save className="w-4 h-4" /> Simpan
                </button>
              </div>
            </div>
            {showDefDetails && (
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="p-2">Nama</th>
                      {monthsInQuarter.map((m) => (
                        <th key={m} className="p-2">
                          Bulan {m}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(
                      new Map(
                        defRows.map((r) => [r.user_id, r.full_name])
                      ).entries()
                    ).map(([uid, name]) => (
                      <tr key={uid} className="border-t">
                        <td className="p-2 font-medium whitespace-nowrap">
                          {name}
                        </td>
                        {monthsInQuarter.map((m) => {
                          const rowIdx = defRows.findIndex(
                            (r) => r.user_id === uid && r.month === m
                          );
                          const val =
                            rowIdx >= 0 ? defRows[rowIdx].deficiency_hours : 0;
                          return (
                            <td key={m} className="p-2">
                              <input
                                type="number"
                                min={0}
                                className="w-24 px-2 py-1 border border-gray-300 rounded-lg"
                                value={val}
                                onChange={(e) => {
                                  const v = Number(e.target.value);
                                  setDefRows((prev) =>
                                    prev.map((x, i) =>
                                      i === rowIdx
                                        ? {
                                            ...x,
                                            deficiency_hours: isNaN(v) ? 0 : v,
                                          }
                                        : x
                                    )
                                  );
                                }}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4">
              {editing ? "Edit Triwulan" : "Buat Triwulan"}
            </h3>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Tahun
                  </label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={(e) =>
                      setForm({ ...form, year: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Quarter
                  </label>
                  <select
                    value={form.quarter}
                    onChange={(e) =>
                      setForm({ ...form, quarter: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value={1}>Q1</option>
                    <option value={2}>Q2</option>
                    <option value={3}>Q3</option>
                    <option value={4}>Q4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) =>
                      setForm({ ...form, start_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) =>
                      setForm({ ...form, end_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white"
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

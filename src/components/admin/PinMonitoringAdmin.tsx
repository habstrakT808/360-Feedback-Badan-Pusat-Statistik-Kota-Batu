"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Users, CheckCircle2, CircleDashed, TrendingUp } from "lucide-react";
import { PinMonitoringService } from "@/lib/pin-monitoring-service";
import { PinPeriodService } from "@/lib/pin-period-service";
import { toast } from "react-hot-toast";

type PeriodLite = { id: string; month: number | null; year: number | null; start_date: any; end_date: any; is_active: boolean; is_completed: boolean };

function formatMonthYear(month?: number | null, year?: number | null) {
  if (!month || !year) return "Custom Range";
  try {
    return `${new Date(0, month - 1).toLocaleString("id-ID", { month: "long" })} ${year}`;
  } catch {
    return `${month}/${year}`;
  }
}

export function PinMonitoringAdmin() {
  const [isLoading, setIsLoading] = useState(true);
  const [periods, setPeriods] = useState<PeriodLite[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<'active' | 'completed' | 'all'>('active');
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadPeriods();
  }, []);

  useEffect(() => {
    if (periods.length > 0 && selectedPeriodId === null) {
      const active = periods.find((p) => p.is_active);
      setSelectedPeriodId(active ? active.id : periods[0]?.id || null);
    }
  }, [periods, selectedPeriodId]);

  useEffect(() => {
    if (selectedPeriodId) loadData(selectedPeriodId);
  }, [selectedPeriodId]);

  const filteredPeriods = useMemo(() => {
    if (statusFilter === 'active') return periods.filter((p) => p.is_active);
    if (statusFilter === 'completed') return periods.filter((p) => p.is_completed && !p.is_active);
    return periods;
  }, [periods, statusFilter]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      (r.full_name || '').toLowerCase().includes(q) ||
      (r.email || '').toLowerCase().includes(q) ||
      (r.department || '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  const loadPeriods = async () => {
    try {
      setIsLoading(true);
      const list = await PinPeriodService.list();
      setPeriods(list as any);
    } catch (e: any) {
      toast.error(e?.message || "Gagal memuat periode pin");
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async (pid: string) => {
    try {
      setIsLoading(true);
      const { rows, meta } = await PinMonitoringService.get(pid);
      setRows(rows);
      setMeta(meta);
    } catch (e: any) {
      toast.error(e?.message || "Gagal memuat data monitoring");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Monitoring Pin</h2>
            <p className="text-gray-600">Lihat siapa yang sudah mengisi dan sisa pin per periode</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Status</span>
              <div className="bg-gray-100 rounded-xl p-1 flex">
                {([
                  { id: 'active', label: 'Aktif' },
                  { id: 'completed', label: 'Selesai' },
                  { id: 'all', label: 'Semua' },
                ] as const).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setStatusFilter(opt.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm ${statusFilter === opt.id ? 'bg-white text-blue-600 shadow' : 'text-gray-700'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                value={selectedPeriodId || ''}
                onChange={(e) => setSelectedPeriodId(e.target.value || null)}
                className="px-3 py-2 border border-gray-300 rounded-xl"
              >
                {filteredPeriods.length === 0 && <option value="">Tidak ada periode</option>}
                {filteredPeriods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {formatMonthYear(p.month, p.year)}
                    {p.is_active ? ' (Aktif)' : p.is_completed ? ' (Selesai)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama/email/departemen..."
              className="w-full sm:w-72 px-3 py-2 border border-gray-300 rounded-xl"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="animate-pulse h-24 bg-gray-100 rounded-xl" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-3 px-4">Pegawai</th>
                  <th className="py-3 px-4">Departemen</th>
                  <th className="py-3 px-4">Posisi</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Dipakai</th>
                  <th className="py-3 px-4">Sisa</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">Tidak ada data</td>
                  </tr>
                ) : (
                  filteredRows.map((r, idx) => (
                    <tr key={r.user_id} className={idx % 2 === 1 ? 'bg-gray-50/50' : ''}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                            {r.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={r.avatar_url} alt={r.full_name || 'avatar'} className="w-full h-full object-cover" />
                            ) : (
                              <Users className="w-4 h-4 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{r.full_name || r.email || r.user_id}</div>
                            <div className="text-xs text-gray-500">{r.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{r.department || '-'}</td>
                      <td className="py-3 px-4 text-gray-700">{r.position || '-'}</td>
                      <td className="py-3 px-4">
                        {r.has_submitted ? (
                          <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 px-2 py-1 rounded-full text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Sudah isi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-100 px-2 py-1 rounded-full text-xs">
                            <CircleDashed className="w-3.5 h-3.5" /> Belum isi
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{r.pins_used}</td>
                      <td className="py-3 px-4 font-medium {r.pins_remaining === 0 ? 'text-red-600' : 'text-gray-900'}">{r.pins_remaining}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {meta?.period && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-gray-500">
            Periode: {formatMonthYear(meta.period.month, meta.period.year)}
          </motion.div>
        )}
      </div>
    </div>
  );
}



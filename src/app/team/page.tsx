// src/app/team/page.tsx
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmployeeCard } from "@/components/team/EmployeeCard";
import { TeamStats } from "@/components/team/TeamStats";
import { TeamPerformanceChart } from "@/components/team/TeamPerformanceChart";
import { Loading } from "@/components/ui/Loading";
import { TeamService } from "@/lib/team-service";
import {
  Users,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Plus,
  Download,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { ExportButton } from "@/components/export/ExportButton";

export default function TeamPage() {
  const [teamData, setTeamData] = useState<any[]>([]);
  const [assignmentStats, setAssignmentStats] = useState<any>({
    stats: {},
    assignments: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "rating" | "feedback">(
    "rating"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterBy, setFilterBy] = useState<"all" | "high" | "medium" | "low">(
    "all"
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      const [performance, stats] = await Promise.all([
        TeamService.getTeamPerformance(),
        TeamService.getAssignmentStats(),
      ]);

      setTeamData(performance);
      setAssignmentStats(stats);
    } catch (error: any) {
      toast.error("Gagal memuat data tim");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedData = teamData
    .filter((emp) => {
      const matchesSearch = (emp.employee?.full_name || emp.full_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const rating = emp.averageRating || 0;
      const matchesFilter =
        filterBy === "all" ||
        (filterBy === "high" && rating >= 8) ||
        (filterBy === "medium" && rating >= 6 && rating < 8) ||
        (filterBy === "low" && rating < 6);

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "name":
          aValue = (a.employee?.full_name || a.full_name || "").toLowerCase();
          bValue = (b.employee?.full_name || b.full_name || "").toLowerCase();
          break;
        case "rating":
          aValue = a.averageRating || 0;
          bValue = b.averageRating || 0;
          break;
        case "feedback":
          aValue = a.totalFeedback || 0;
          bValue = b.totalFeedback || 0;
          break;
        default:
          return 0;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleViewDetails = (employee: any) => {
    toast.success("Fitur detail karyawan akan segera tersedia!");
  };

  const handleEditEmployee = (employee: any) => {
    toast.success("Fitur edit karyawan akan segera tersedia!");
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-20">
          <Loading size="lg" text="Memuat data tim..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">
                Manajemen Tim
              </h1>
              <p className="text-gray-600">
                Overview performa dan data karyawan
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <ExportButton
              data={teamData}
              type="team"
              title="Team Performance Report"
              variant="secondary"
            />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Tambah</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <TeamStats teamData={teamData} assignmentStats={assignmentStats} />
        </motion.div>

        {/* Performance Charts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <TeamPerformanceChart teamData={teamData} />
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Cari karyawan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as any)}
                  className="border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Semua Performa</option>
                  <option value="high">Tinggi (8+)</option>
                  <option value="medium">Sedang (6-8)</option>
                  <option value="low">Rendah (&lt;6)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={sortBy}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setSortBy(e.target.value as "name" | "rating" | "feedback")
                  }
                  className="border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="rating">Rating</option>
                  <option value="name">Nama</option>
                  <option value="feedback">Feedback</option>
                </select>

                <button
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {sortOrder === "asc" ? (
                    <SortAsc className="w-4 h-4" />
                  ) : (
                    <SortDesc className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="flex items-center space-x-1 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === "grid"
                      ? "bg-white shadow-sm"
                      : "hover:bg-gray-200"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === "list"
                      ? "bg-white shadow-sm"
                      : "hover:bg-gray-200"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Menampilkan {filteredAndSortedData.length} dari {teamData.length}{" "}
            karyawan
          </div>
        </motion.div>

        {/* Employee Grid/List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }
            >
              {filteredAndSortedData.map((employee, index) => (
                <EmployeeCard
                  key={employee.employee?.id || index}
                  employee={employee}
                  onViewDetails={handleViewDetails}
                  onEdit={handleEditEmployee}
                />
              ))}
            </motion.div>
          </AnimatePresence>

          {filteredAndSortedData.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Tidak ada karyawan ditemukan
              </h3>
              <p className="text-gray-600">
                Coba ubah filter atau kata kunci pencarian
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

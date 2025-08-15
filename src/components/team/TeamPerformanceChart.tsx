// src/components/team/TeamPerformanceChart.tsx
"use client";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface TeamPerformanceChartProps {
  teamData: any[];
}

export function TeamPerformanceChart({ teamData }: TeamPerformanceChartProps) {
  // Prepare data for performance distribution
  const performanceRanges = [
    { range: "9-10", label: "Excellent", count: 0, color: "#10b981" },
    { range: "8-8.9", label: "Very Good", count: 0, color: "#3b82f6" },
    { range: "7-7.9", label: "Good", count: 0, color: "#8b5cf6" },
    { range: "6-6.9", label: "Fair", count: 0, color: "#f59e0b" },
    { range: "5-5.9", label: "Poor", count: 0, color: "#ef4444" },
    { range: "0-4.9", label: "Very Poor", count: 0, color: "#dc2626" },
  ];

  teamData.forEach((emp) => {
    const rating = emp.averageRating || 0;
    if (rating >= 9) performanceRanges[0].count++;
    else if (rating >= 8) performanceRanges[1].count++;
    else if (rating >= 7) performanceRanges[2].count++;
    else if (rating >= 6) performanceRanges[3].count++;
    else if (rating >= 5) performanceRanges[4].count++;
    else performanceRanges[5].count++;
  });

  // Top performers data
  const topPerformers = teamData
    .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    .slice(0, 10)
    .map((emp) => ({
      name: (emp.employee?.full_name || emp.full_name || "N/A").split(" ")[0],
      rating: emp.averageRating || 0,
      fullName: emp.employee?.full_name || emp.full_name || "N/A",
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Performance Distribution */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-6">
          Distribusi Performa Tim
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={performanceRanges.filter((range) => range.count > 0)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ range, count, percent }) =>
                  `${range}: ${percent ? (percent * 100).toFixed(0) : 0}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {performanceRanges.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "none",
                  borderRadius: "12px",
                  color: "#fff",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Top Performers */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-6">
          Top 10 Performers
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topPerformers} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                type="number"
                domain={[0, 10]}
                tick={{ fontSize: 12, fill: "#6b7280" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "none",
                  borderRadius: "12px",
                  color: "#fff",
                }}
                formatter={(value: any, name: any, props: any) => [
                  `${value.toFixed(1)}/10`,
                  props.payload.fullName,
                ]}
              />
              <Bar
                dataKey="rating"
                fill="url(#colorGradient)"
                radius={[0, 4, 4, 0]}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.8} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}

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
  ReferenceLine,
  Line,
  ComposedChart,
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

  // Top performers data - ensure we have data to display
  const topPerformers = teamData
    .filter((emp) => (emp.averageRating || 0) > 0) // Only show employees with ratings
    .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    .slice(0, 10)
    .map((emp) => ({
      name: (emp.employee?.full_name || emp.full_name || "N/A").split(" ")[0],
      rating: emp.averageRating || 0,
      fullName: emp.employee?.full_name || emp.full_name || "N/A",
    }));

  // Calculate average team rating for reference line
  const averageTeamRating = teamData.length > 0 
    ? teamData.reduce((sum, emp) => sum + (emp.averageRating || 0), 0) / teamData.length
    : 0;

  // Generate sample data if no real data exists (for demonstration)
  const sampleData = [
    { name: "Singgih", rating: 8.5, fullName: "Singgih" },
    { name: "Eka", rating: 7.8, fullName: "Eka" },
    { name: "Wahyu", rating: 7.2, fullName: "Wahyu" },
    { name: "Dhika", rating: 6.9, fullName: "Dhika" },
    { name: "Nurlaila", rating: 6.5, fullName: "Nurlaila" },
  ];

  // Use real data if available, otherwise use sample data
  const chartData = topPerformers.length > 0 ? topPerformers : sampleData;

  // Ensure we have valid data for the chart
  const validChartData = chartData.filter(item => item.rating > 0);

  // Debug logging
  console.log('Chart Data:', {
    teamData: teamData.length,
    topPerformers: topPerformers.length,
    chartData: chartData.length,
    validChartData: validChartData.length,
    sampleData: sampleData,
    chartDataFinal: validChartData
  });

  // Custom legend formatter for pie chart
  const renderCustomLegend = (value: string, entry: any) => {
    const { color, payload } = entry;
    if (payload && payload.count > 0) {
      return (
        <span style={{ color }}>
          {payload.range}: {payload.count} karyawan
        </span>
      );
    }
    return null;
  };

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.range}</p>
          <p className="text-gray-600">{data.label}</p>
          <p className="text-blue-600 font-medium">
            {data.count} karyawan (
            {((data.count / teamData.length) * 100).toFixed(0)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for bar chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.fullName}</p>
          <p className="text-blue-600 font-medium">
            Rating: {data.rating.toFixed(1)}/10
          </p>
        </div>
      );
    }
    return null;
  };

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
                label={({ range, count, percent }) => {
                  const p = Number(percent ?? 0)
                  return `${range}: ${Number.isFinite(p) ? (p * 100).toFixed(0) : 0}%`
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {performanceRanges.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
              <Legend
                formatter={renderCustomLegend}
                wrapperStyle={{ fontSize: "12px" }}
              />
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
        <h3 className="text-lg font-bold text-gray-900 mb-6">Top Performers</h3>
        <div className="h-80">
          {validChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={validChartData} layout="horizontal" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  type="number"
                  domain={[0, 10]}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  tickFormatter={(value) => value.toFixed(1)}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  width={80}
                />
                <Tooltip content={<CustomBarTooltip />} />
                
                {/* Reference line for average team performance */}
                <ReferenceLine 
                  x={averageTeamRating} 
                  stroke="#ef4444" 
                  strokeDasharray="3 3"
                  strokeWidth={2}
                  label={{
                    value: `Rata-rata: ${averageTeamRating.toFixed(1)}`,
                    position: 'top',
                    fill: '#ef4444',
                    fontSize: 12
                  }}
                />
                
                {/* Reference line for good performance threshold */}
                <ReferenceLine 
                  x={8} 
                  stroke="#10b981" 
                  strokeDasharray="2 2"
                  strokeWidth={1.5}
                  label={{
                    value: 'Target: 8.0',
                    position: 'top',
                    fill: '#10b981',
                    fontSize: 10
                  }}
                />
                
                {/* Line connecting the bars for trend visualization - MADE MORE VISIBLE */}
                <Line
                  type="monotone"
                  dataKey="rating"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
                  connectNulls={false}
                  isAnimationActive={true}
                />
                
                {/* Bars showing individual performance */}
                <Bar
                  dataKey="rating"
                  fill="url(#colorGradient)"
                  radius={[0, 4, 4, 0]}
                  barSize={25}
                  opacity={0.8}
                />
                
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <p className="text-lg font-medium mb-2">
                  Belum ada data rating
                </p>
                <p className="text-sm">
                  Karyawan belum dinilai untuk periode ini
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

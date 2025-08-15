// src/components/charts/BarChart.tsx
"use client";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { motion } from "framer-motion";

interface BarChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  title?: string;
}

export function BarChart({ data, title }: BarChartProps) {
  const colors = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#84cc16",
    "#22c55e",
    "#06b6d4",
    "#3b82f6",
    "#8b5cf6",
    "#a855f7",
    "#ec4899",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "none",
                borderRadius: "12px",
                color: "#fff",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || colors[index % colors.length]}
                />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

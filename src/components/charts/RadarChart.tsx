// src/components/charts/RadarChart.tsx
"use client";
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion } from "framer-motion";

interface RadarChartProps {
  data: Array<{
    aspect: string;
    rating: number;
    maxRating?: number;
  }>;
}

export function RadarChart({ data }: RadarChartProps) {
  const processedData = data.map((item) => ({
    ...item,
    fullMark: 10,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-80"
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart data={processedData}>
          <PolarGrid stroke="#e5e7eb" strokeWidth={1} radialLines={false} />
          <PolarAngleAxis
            dataKey="aspect"
            tick={{ fontSize: 12, fill: "#6b7280" }}
            className="text-xs"
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 10]}
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickCount={6}
          />
          <Radar
            name="Rating"
            dataKey="rating"
            stroke="#3b82f6"
            fill="url(#radarGradient)"
            fillOpacity={0.3}
            strokeWidth={3}
            dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
          />
          <defs>
            <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
        </RechartsRadarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

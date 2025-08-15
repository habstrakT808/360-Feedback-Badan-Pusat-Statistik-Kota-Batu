// src/components/charts/CircularProgress.tsx
"use client";
import { motion } from "framer-motion";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

interface CircularProgressProps {
  value: number;
  maxValue?: number;
  text?: string;
  color?: string;
  size?: number;
}

export function CircularProgress({
  value,
  maxValue = 10,
  text,
  color = "#3b82f6",
  size = 120,
}: CircularProgressProps) {
  const percentage = (value / maxValue) * 100;

  const getColor = (val: number) => {
    if (val <= 30) return "#ef4444";
    if (val <= 60) return "#f59e0b";
    if (val <= 80) return "#3b82f6";
    return "#10b981";
  };

  const dynamicColor = getColor(percentage);

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
      className="flex flex-col items-center"
      style={{ width: size, height: size }}
    >
      <CircularProgressbar
        value={percentage}
        text={text || `${value.toFixed(1)}`}
        styles={buildStyles({
          textColor: dynamicColor,
          pathColor: dynamicColor,
          trailColor: "#f3f4f6",
          textSize: "20px",
          pathTransitionDuration: 1,
        })}
      />
    </motion.div>
  );
}

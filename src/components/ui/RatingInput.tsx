// src/components/ui/RatingInput.tsx
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";

interface RatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  max?: number;
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
  disabled?: boolean;
}

export function RatingInput({
  value,
  onChange,
  max = 10,
  size = "md",
  showNumber = true,
  disabled = false,
}: RatingInputProps) {
  const [hover, setHover] = useState(0);

  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const getRatingColor = (rating: number) => {
    if (rating <= 3) return "text-red-500";
    if (rating <= 6) return "text-yellow-500";
    if (rating <= 8) return "text-blue-500";
    return "text-green-500";
  };

  const getRatingText = (rating: number) => {
    if (rating === 0) return "Belum dinilai";
    if (rating <= 2) return "Sangat Kurang";
    if (rating <= 4) return "Kurang";
    if (rating <= 6) return "Cukup";
    if (rating <= 8) return "Baik";
    return "Sangat Baik";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          {Array.from({ length: max }, (_, i) => {
            const rating = i + 1;
            const isActive = rating <= (hover || value);

            return (
              <motion.button
                key={rating}
                type="button"
                disabled={disabled}
                onMouseEnter={() => !disabled && setHover(rating)}
                onMouseLeave={() => !disabled && setHover(0)}
                onClick={() => !disabled && onChange(rating)}
                whileHover={{ scale: disabled ? 1 : 1.1 }}
                whileTap={{ scale: disabled ? 1 : 0.9 }}
                className={`
                  ${sizeClasses[size]} 
                  transition-all duration-200 
                  ${
                    disabled
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer"
                  }
                  ${isActive ? getRatingColor(rating) : "text-gray-300"}
                  hover:scale-110
                `}
              >
                <Star
                  className={`w-full h-full ${isActive ? "fill-current" : ""}`}
                />
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {showNumber && (
            <motion.div
              key={hover || value}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center space-x-2"
            >
              <span
                className={`text-2xl font-bold ${getRatingColor(
                  hover || value
                )}`}
              >
                {hover || value || 0}
              </span>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">/{max}</div>
                <div className={`text-xs ${getRatingColor(hover || value)}`}>
                  {getRatingText(hover || value)}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${((hover || value) / max) * 100}%` }}
          transition={{ duration: 0.3 }}
          className={`h-2 rounded-full ${
            (hover || value) <= 3
              ? "bg-gradient-to-r from-red-400 to-red-500"
              : (hover || value) <= 6
              ? "bg-gradient-to-r from-yellow-400 to-yellow-500"
              : (hover || value) <= 8
              ? "bg-gradient-to-r from-blue-400 to-blue-500"
              : "bg-gradient-to-r from-green-400 to-green-500"
          }`}
        />
      </div>
    </div>
  );
}

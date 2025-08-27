"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RatingInputProps {
  value?: number; // actual value in the real scale (e.g., 71-90 or 1-100)
  onChange: (rating: number) => void; // returns value in the real scale
  max?: number; // number of stars/segments to display
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
  disabled?: boolean;
  minValue?: number; // minimum of real scale (default 1)
  maxValue?: number; // maximum of real scale (default equals max)
}

export function RatingInput({
  value,
  onChange,
  max = 10,
  size = "md",
  showNumber = true,
  disabled = false,
  minValue = 1,
  maxValue,
}: RatingInputProps) {
  const effectiveMaxValue = maxValue ?? max;

  // Initialize with empty when no value provided
  const [localValue, setLocalValue] = useState<number | null>(
    typeof value === "number" ? value : null
  );
  const [inputValue, setInputValue] = useState<string>(
    typeof value === "number" ? value.toString() : ""
  );

  // Update localValue when value prop changes
  useEffect(() => {
    if (typeof value === "number") {
      setLocalValue(value);
      setInputValue(value.toString());
    } else {
      setLocalValue(null);
      setInputValue("");
    }
  }, [value]);

  const sizeClasses = {
    sm: "text-sm py-2 px-3",
    md: "text-base py-2.5 px-3.5",
    lg: "text-lg py-3 px-4",
  };

  const getRatingColor = (rating: number | null) => {
    if (rating === null || isNaN(rating) || rating < minValue)
      return "text-gray-400";

    // Normalize to 0..1 based on real scale
    const ratio = (rating - minValue) / (effectiveMaxValue - minValue);
    if (ratio <= 0.25) return "text-red-500";
    if (ratio <= 0.5) return "text-yellow-500";
    if (ratio <= 0.75) return "text-blue-500";
    return "text-green-500";
  };

  const getRatingText = (rating: number | null) => {
    if (rating === null || isNaN(rating) || rating < minValue)
      return "Belum dinilai";

    // Different text based on scale
    if (minValue === 71) {
      // User biasa (71-90)
      if (rating >= 85) return "Sangat Baik";
      if (rating >= 80) return "Baik";
      if (rating >= 75) return "Cukup Baik";
      return "Cukup";
    } else {
      // Supervisor (1-100)
      const ratio = (rating - minValue) / (effectiveMaxValue - minValue);
      if (ratio <= 0.2) return "Perlu Perbaikan";
      if (ratio <= 0.4) return "Cukup";
      if (ratio <= 0.6) return "Baik";
      if (ratio <= 0.8) return "Sangat Baik";
      return "Istimewa";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;

    // Allow any input while typing
    setInputValue(rawValue);

    // Only update localValue if it's a valid number
    const numValue = Number(rawValue);
    if (!isNaN(numValue)) {
      setLocalValue(numValue);
    }
  };

  const handleInputBlur = () => {
    const numValue = Number(inputValue);

    // If input is empty or invalid, keep empty and do not emit change
    if (inputValue === "" || isNaN(numValue)) {
      setLocalValue(null);
      setInputValue("");
      return;
    }

    // Apply min/max constraints
    let constrainedValue = numValue;
    if (numValue < minValue) {
      constrainedValue = minValue;
    } else if (numValue > effectiveMaxValue) {
      constrainedValue = effectiveMaxValue;
    }

    setInputValue(constrainedValue.toString());
    setLocalValue(constrainedValue);
    onChange(constrainedValue);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-6">
        {/* Manual Number Input */}
        <div className="flex items-center space-x-2">
          <motion.input
            type="number"
            min={minValue}
            max={effectiveMaxValue}
            step={1}
            value={inputValue}
            disabled={disabled}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            className={`w-28 text-center rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              sizeClasses[size]
            } ${getRatingColor(localValue)} ${
              disabled ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
            whileFocus={{ scale: disabled ? 1 : 1.02 }}
            placeholder={""}
          />
        </div>

        <AnimatePresence mode="wait">
          {showNumber && (
            <motion.div
              key={`v-${localValue ?? "empty"}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center space-x-2"
            >
              <span
                className={`text-2xl font-bold ${getRatingColor(localValue)}`}
              >
                {localValue === null ? "" : localValue}
              </span>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  /{effectiveMaxValue}
                </div>
                <div className={`text-xs ${getRatingColor(localValue)}`}>
                  {getRatingText(localValue)}
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
          animate={{
            width: `${
              localValue === null
                ? 0
                : Math.max(
                    0,
                    Math.min(
                      100,
                      ((localValue - minValue) /
                        (effectiveMaxValue - minValue)) *
                        100
                    )
                  )
            }%`,
          }}
          transition={{ duration: 0.3 }}
          className={`h-2 rounded-full ${
            localValue === null
              ? "bg-gray-300"
              : localValue <= minValue + 0.25 * (effectiveMaxValue - minValue)
              ? "bg-gradient-to-r from-red-400 to-red-500"
              : localValue <= minValue + 0.5 * (effectiveMaxValue - minValue)
              ? "bg-gradient-to-r from-yellow-400 to-yellow-500"
              : localValue <= minValue + 0.75 * (effectiveMaxValue - minValue)
              ? "bg-gradient-to-r from-blue-400 to-blue-500"
              : "bg-gradient-to-r from-green-400 to-green-500"
          }`}
        />
      </div>

      {/* Helper text for validation */}
      {localValue !== null && localValue < minValue && (
        <p className="text-red-500 text-xs">Rating minimum adalah {minValue}</p>
      )}
      {localValue !== null && localValue > effectiveMaxValue && (
        <p className="text-red-500 text-xs">
          Rating maksimum adalah {effectiveMaxValue}
        </p>
      )}
    </div>
  );
}

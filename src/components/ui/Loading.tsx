// src/components/ui/Loading.tsx
"use client";
import { motion } from "framer-motion";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function Loading({ size = "md", text }: LoadingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-600 rounded-full`}
      />
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-600 text-sm"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}

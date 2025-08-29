// src/components/export/AdminExportButton.tsx
"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Database, Download } from "lucide-react";
import { AdminExportModal } from "./AdminExportModal";
import { useUserRole } from "@/hooks/useUserRole";

interface AdminExportButtonProps {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AdminExportButton({
  variant = "primary",
  size = "md",
  className = "",
}: AdminExportButtonProps) {
  const { isAdmin, isSupervisor, isLoading } = useUserRole();
  const [showModal, setShowModal] = useState(false);

  // Check permissions but don't return early to avoid hooks order issues
  const hasPermission = !isLoading && (isAdmin || isSupervisor);

  console.log(
    "🔍 AdminExportButton: Permission check - Loading:",
    isLoading,
    "IsAdmin:",
    isAdmin,
    "IsSupervisor:",
    isSupervisor,
    "HasPermission:",
    hasPermission
  );

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };

  const variantClasses = {
    primary:
      "bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    outline: "border-2 border-purple-600 text-purple-600 hover:bg-purple-50",
  };

  return (
    <>
      {hasPermission && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          className={`
            ${sizeClasses[size]}
            ${variantClasses[variant]}
            ${className}
            rounded-lg font-medium transition-all duration-200 flex items-center space-x-2
          `}
        >
          <Database className="w-4 h-4" />
          <span>Admin Export</span>
        </motion.button>
      )}

      <AdminExportModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

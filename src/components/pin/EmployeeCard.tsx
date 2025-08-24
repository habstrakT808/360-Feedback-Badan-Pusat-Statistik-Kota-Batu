// src/components/pin/EmployeeCard.tsx
"use client";
import { motion } from "framer-motion";
import { Pin, User } from "lucide-react";

interface EmployeeCardProps {
  employee: {
    id: string;
    full_name: string;
    email?: string;
    avatar_url?: string;
  };
  onGivePin: (employeeId: string) => void;
  canGivePin: boolean;
  isGivingPin: boolean;
  isCurrentUser?: boolean;
}

export function EmployeeCard({
  employee,
  onGivePin,
  canGivePin,
  isGivingPin,
  isCurrentUser = false,
}: EmployeeCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg">
          {employee.avatar_url ? (
            <img
              src={employee.avatar_url}
              alt={employee.full_name}
              className="w-full h-full rounded-2xl object-cover"
            />
          ) : (
            getInitials(employee.full_name)
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-xl font-bold text-gray-900">
              {employee.full_name}
            </h3>
            {isCurrentUser && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                Anda
              </span>
            )}
          </div>
          <p className="text-gray-600 text-sm">
            {employee.email || "Tidak ada email"}
          </p>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onGivePin(employee.id)}
        disabled={!canGivePin || isGivingPin}
        className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
          canGivePin && !isGivingPin
            ? "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 shadow-lg hover:shadow-xl"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        {canGivePin && !isGivingPin ? (
          <div className="flex items-center justify-center space-x-2">
            <Pin className="w-5 h-5" />
            <span>Berikan Pin</span>
          </div>
        ) : (
          <span>
            {isGivingPin ? "Sedang memproses..." : "Pin tidak tersedia"}
          </span>
        )}
      </motion.button>
    </motion.div>
  );
}

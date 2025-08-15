// src/components/team/EmployeeCard.tsx
"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  Edit,
  MoreVertical,
  Mail,
  MapPin,
  Award,
} from "lucide-react";
import { getInitials } from "@/lib/utils";

interface EmployeeCardProps {
  employee: any;
  onEdit?: (employee: any) => void;
  onViewDetails?: (employee: any) => void;
}

export function EmployeeCard({
  employee,
  onEdit,
  onViewDetails,
}: EmployeeCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "text-green-600 bg-green-100";
    if (rating >= 6) return "text-blue-600 bg-blue-100";
    if (rating >= 4) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getRatingTrend = (rating: number) => {
    if (rating >= 8) return { icon: TrendingUp, color: "text-green-500" };
    if (rating >= 6) return { icon: Minus, color: "text-gray-500" };
    return { icon: TrendingDown, color: "text-red-500" };
  };

  const ratingInfo = getRatingColor(employee.averageRating || 0);
  const TrendIcon = getRatingTrend(employee.averageRating || 0).icon;
  const trendColor = getRatingTrend(employee.averageRating || 0).color;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 relative"
    >
      {/* Menu Button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-10 right-0 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10 min-w-[150px]"
          >
            <button
              onClick={() => {
                onViewDetails?.(employee);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
            >
              Lihat Detail
            </button>
            <button
              onClick={() => {
                onEdit?.(employee);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
            >
              Edit Profile
            </button>
          </motion.div>
        )}
      </div>

      {/* Profile Section */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg">
          {employee.employee?.avatar_url ? (
            <img
              src={employee.employee.avatar_url}
              alt={employee.employee.full_name}
              className="w-16 h-16 rounded-2xl object-cover"
            />
          ) : (
            getInitials(
              employee.employee?.full_name || employee.full_name || "N/A"
            )
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {employee.employee?.full_name || employee.full_name || "N/A"}
          </h3>
          <p className="text-gray-600 text-sm mb-1">
            {employee.employee?.position ||
              employee.position ||
              "Tidak ada posisi"}
          </p>
          <p className="text-gray-500 text-xs">
            {employee.employee?.department ||
              employee.department ||
              "Tidak ada departemen"}
          </p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="space-y-3">
        {/* Overall Rating */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Rating Keseluruhan</span>
          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-1 rounded-full text-sm font-medium ${ratingInfo}`}
            >
              {(employee.averageRating || 0).toFixed(1)}/10
            </span>
            <TrendIcon className={`w-4 h-4 ${trendColor}`} />
          </div>
        </div>

        {/* Feedback Count */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total Feedback</span>
          <span className="text-sm font-medium text-gray-900">
            {employee.totalFeedback || 0}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Progress</span>
            <span>
              {Math.round(((employee.averageRating || 0) / 10) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${((employee.averageRating || 0) / 10) * 100}%`,
              }}
              transition={{ duration: 1, delay: 0.5 }}
              className={`h-2 rounded-full ${
                (employee.averageRating || 0) >= 8
                  ? "bg-gradient-to-r from-green-400 to-green-600"
                  : (employee.averageRating || 0) >= 6
                  ? "bg-gradient-to-r from-blue-400 to-blue-600"
                  : (employee.averageRating || 0) >= 4
                  ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                  : "bg-gradient-to-r from-red-400 to-red-600"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Mail className="w-3 h-3" />
            <span className="truncate">
              {employee.employee?.email || employee.email || "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onViewDetails?.(employee)}
        className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
      >
        Lihat Detail
      </motion.button>
    </motion.div>
  );
}

// src/components/pin/PinCard.tsx
"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Pin, User, Award, Star } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { PinRanking } from "@/lib/pin-service";

interface PinCardProps {
  user: PinRanking;
  onGivePin: (userId: string) => void;
  canGivePin: boolean;
  pinsRemaining: number;
  isCurrentUser: boolean;
  onCardClick?: (user: PinRanking) => void;
  periodType: "weekly" | "monthly";
  periodInfo: {
    weekNumber?: number;
    year: number;
    month?: number;
  };
}

export function PinCard({
  user,
  onGivePin,
  canGivePin,
  pinsRemaining,
  isCurrentUser,
  onCardClick,
  periodType,
  periodInfo,
}: PinCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getRankColor = (rank: number) => {
    if (rank === 1) return "from-yellow-400 to-yellow-600";
    if (rank === 2) return "from-gray-300 to-gray-500";
    if (rank === 3) return "from-amber-600 to-amber-800";
    return "from-blue-500 to-purple-600";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Star className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Award className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return null;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "🥇 1st Place";
    if (rank === 2) return "🥈 2nd Place";
    if (rank === 3) return "🥉 3rd Place";
    return `#${rank}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onCardClick?.(user)}
      className={`relative bg-white rounded-2xl p-6 shadow-lg border-2 transition-all duration-300 cursor-pointer ${
        user.rank <= 3
          ? `border-gradient-to-r ${getRankColor(user.rank)}`
          : "border-gray-100 hover:border-blue-200"
      }`}
    >
      {/* Rank Badge */}
      {user.rank <= 3 && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
            {getRankBadge(user.rank)}
          </div>
        </div>
      )}

      {/* Rank Icon */}
      {user.rank <= 3 && (
        <div className="absolute top-4 right-4">{getRankIcon(user.rank)}</div>
      )}

      {/* Profile Section */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-full h-full rounded-2xl object-cover"
              />
            ) : (
              getInitials(user.full_name)
            )}
          </div>

          {/* Pin Count Badge */}
          <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
            {user.pin_count}
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {user.full_name}
          </h3>
          <div className="flex items-center space-x-2">
            <Pin className="w-4 h-4 text-red-500" />
            <span className="text-gray-600">
              {user.pin_count} pin{user.pin_count !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Action Button - Dihapus karena fungsi pin hanya ada di tab "Berikan Pin" */}
      {/* {!isCurrentUser && canGivePin && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onGivePin(user.user_id)}
          disabled={pinsRemaining <= 0}
          className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
            pinsRemaining > 0
              ? "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 shadow-lg hover:shadow-xl"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {pinsRemaining > 0 ? (
            <div className="flex items-center justify-center space-x-2">
              <Pin className="w-5 h-5" />
              <span>Berikan Pin</span>
            </div>
          ) : (
            <span>Pin Habis</span>
          )}
        </motion.button>
      )} */}

      {/* Current User Indicator - Dihapus untuk konsistensi tampilan */}
      {/* {isCurrentUser && (
        <div className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold text-center">
          <div className="flex items-center justify-center space-x-2">
            <User className="w-5 h-5" />
            <span>Anda</span>
          </div>
        </div>
      )} */}

      {/* Pins Remaining Info - Dihapus untuk konsistensi tampilan */}
      {/* {isCurrentUser && (
        <div className="mt-3 text-center text-sm text-gray-600">
          Pin tersisa:{" "}
          <span className="font-bold text-blue-600">{pinsRemaining}</span>
        </div>
      )} */}

      {/* Hover Effect */}
      {isHovered && user.rank <= 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-2xl pointer-events-none"
        />
      )}
    </motion.div>
  );
}

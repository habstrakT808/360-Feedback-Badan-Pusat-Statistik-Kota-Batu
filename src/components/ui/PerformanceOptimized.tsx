// src/components/ui/PerformanceOptimized.tsx
'use client';

import React, { memo, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { UserAssessmentResult, AspectResult } from '@/types/assessment';
import { Skeleton } from './Skeleton';

// Memoized User Card Component
interface UserCardProps {
  user: UserAssessmentResult;
  onViewDetail: (userId: string) => void;
  onAssess?: (userId: string) => void;
  showAssessButton?: boolean;
}

export const UserCard = memo<UserCardProps>(({ 
  user, 
  onViewDetail, 
  onAssess, 
  showAssessButton = false 
}) => {
  const handleViewDetail = useCallback(() => {
    onViewDetail(user.user.id);
  }, [user.user.id, onViewDetail]);

  const handleAssess = useCallback(() => {
    if (onAssess) {
      onAssess(user.user.id);
    }
  }, [user.user.id, onAssess]);

  const scoreColor = useMemo(() => {
    if (!user.finalScore) return 'text-gray-400';
    if (user.finalScore >= 80) return 'text-green-600';
    if (user.finalScore >= 60) return 'text-blue-600';
    return 'text-red-600';
  }, [user.finalScore]);

  const scoreBg = useMemo(() => {
    if (!user.finalScore) return 'bg-gray-100';
    if (user.finalScore >= 80) return 'bg-green-100';
    if (user.finalScore >= 60) return 'bg-blue-100';
    return 'bg-red-100';
  }, [user.finalScore]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
          {user.user.avatar_url ? (
            <img
              src={user.user.avatar_url}
              alt={user.user.full_name}
              className="w-12 h-12 object-cover"
            />
          ) : (
            <span className="text-white font-bold text-lg">
              {user.user.full_name?.charAt(0) || user.user.email?.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {user.user.full_name}
          </h3>
          <p className="text-sm text-gray-600">{user.user.position}</p>
          <p className="text-xs text-gray-500">{user.user.department}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {user.supervisorAverage?.toFixed(1) || 'N/A'}
          </div>
          <div className="text-xs text-gray-500">Supervisor</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {user.peerAverage?.toFixed(1) || 'N/A'}
          </div>
          <div className="text-xs text-gray-500">Peer</div>
        </div>
      </div>

      <div className="text-center mb-4">
        <div className={`text-3xl font-bold ${scoreColor}`}>
          {user.finalScore?.toFixed(1) || 'N/A'}
        </div>
        <div className="text-sm text-gray-500">Final Score</div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">
          Feedback: {user.totalFeedback}
        </span>
        <div className="flex space-x-2">
          <button
            onClick={handleViewDetail}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            Detail
          </button>
          {showAssessButton && onAssess && !user.hasSupervisorAssessment && (
            <button
              onClick={handleAssess}
              className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
            >
              Assess
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

UserCard.displayName = 'UserCard';

// Memoized Aspect Result Component
interface AspectResultRowProps {
  aspect: AspectResult;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}

export const AspectResultRow = memo<AspectResultRowProps>(({
  aspect,
  isExpanded,
  onToggle,
  index
}) => {
  const getRatingColor = useCallback((rating: number | null) => {
    if (!rating) return 'text-gray-400';
    if (rating >= 80) return 'text-green-600';
    if (rating >= 60) return 'text-blue-600';
    if (rating >= 40) return 'text-yellow-600';
    return 'text-red-600';
  }, []);

  const getRatingBg = useCallback((rating: number | null) => {
    if (!rating) return 'bg-gray-100';
    if (rating >= 80) return 'bg-green-100';
    if (rating >= 60) return 'bg-blue-100';
    if (rating >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  }, []);

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 + index * 0.05 }}
      className="hover:bg-gray-50 transition-colors"
    >
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">
          {aspect.aspect}
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <div
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRatingBg(
            aspect.supervisorAverage
          )} ${getRatingColor(aspect.supervisorAverage)}`}
        >
          {aspect.supervisorAverage?.toFixed(1) || 'N/A'}
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <div
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRatingBg(
            aspect.peerAverage
          )} ${getRatingColor(aspect.peerAverage)}`}
        >
          {aspect.peerAverage?.toFixed(1) || 'N/A'}
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <div
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRatingBg(
            aspect.finalScore
          )} ${getRatingColor(aspect.finalScore)}`}
        >
          {aspect.finalScore?.toFixed(1) || 'N/A'}
        </div>
      </td>
      <td className="px-6 py-4 text-center text-sm text-gray-900">
        {aspect.totalFeedback}
      </td>
      <td className="px-6 py-4 text-center">
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isExpanded ? (
            <span className="text-gray-600">▼</span>
          ) : (
            <span className="text-gray-600">▶</span>
          )}
        </button>
      </td>
    </motion.tr>
  );
});

AspectResultRow.displayName = 'AspectResultRow';

// Loading Skeleton for User Cards
export const UserCardSkeleton = memo(() => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="flex items-center space-x-4 mb-4">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton height="1.25rem" width="60%" />
        <Skeleton height="1rem" width="40%" />
        <Skeleton height="0.875rem" width="30%" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div className="text-center space-y-2">
        <Skeleton height="2rem" width="100%" />
        <Skeleton height="0.875rem" width="60%" />
      </div>
      <div className="text-center space-y-2">
        <Skeleton height="2rem" width="100%" />
        <Skeleton height="0.875rem" width="60%" />
      </div>
    </div>
    <div className="text-center mb-4 space-y-2">
      <Skeleton height="2.5rem" width="100%" />
      <Skeleton height="0.875rem" width="50%" />
    </div>
    <div className="flex justify-between items-center">
      <Skeleton height="0.875rem" width="30%" />
      <div className="flex space-x-2">
        <Skeleton height="2rem" width="4rem" />
        <Skeleton height="2rem" width="4rem" />
      </div>
    </div>
  </div>
));

UserCardSkeleton.displayName = 'UserCardSkeleton';

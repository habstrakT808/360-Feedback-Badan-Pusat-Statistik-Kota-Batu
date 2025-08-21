// src/hooks/useAssessment.ts
import { useState, useCallback, useMemo } from 'react';
import { UserAssessmentResult, AspectResult } from '@/types/assessment';

export interface UseAssessmentReturn {
  // State
  userResults: UserAssessmentResult[];
  isLoading: boolean;
  error: string | null;
  expandedAspects: Record<string, boolean>;
  
  // Actions
  setUserResults: (results: UserAssessmentResult[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleAspect: (aspect: string) => void;
  expandAllAspects: () => void;
  collapseAllAspects: () => void;
  
  // Computed values
  totalUsers: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  usersWithSupervisorAssessment: number;
  usersWithPeerAssessment: number;
}

export function useAssessment(): UseAssessmentReturn {
  const [userResults, setUserResults] = useState<UserAssessmentResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedAspects, setExpandedAspects] = useState<Record<string, boolean>>({});

  const toggleAspect = useCallback((aspect: string) => {
    setExpandedAspects(prev => ({
      ...prev,
      [aspect]: !prev[aspect]
    }));
  }, []);

  const expandAllAspects = useCallback(() => {
    const allAspects = new Set<string>();
    userResults.forEach(result => {
      result.aspectResults.forEach(aspect => {
        allAspects.add(aspect.aspect);
      });
    });
    
    const expandedState: Record<string, boolean> = {};
    allAspects.forEach(aspect => {
      expandedState[aspect] = true;
    });
    setExpandedAspects(expandedState);
  }, [userResults]);

  const collapseAllAspects = useCallback(() => {
    setExpandedAspects({});
  }, []);

  // Computed values
  const totalUsers = useMemo(() => userResults.length, [userResults]);
  
  const averageScore = useMemo(() => {
    if (userResults.length === 0) return 0;
    const totalScore = userResults.reduce((sum, result) => {
      return sum + (result.finalScore || 0);
    }, 0);
    return Math.round((totalScore / totalUsers) * 10) / 10;
  }, [userResults, totalUsers]);

  const highestScore = useMemo(() => {
    if (userResults.length === 0) return 0;
    return Math.max(...userResults.map(result => result.finalScore || 0));
  }, [userResults]);

  const lowestScore = useMemo(() => {
    if (userResults.length === 0) return 0;
    return Math.min(...userResults.map(result => result.finalScore || 0));
  }, [userResults]);

  const usersWithSupervisorAssessment = useMemo(() => {
    return userResults.filter(result => result.hasSupervisorAssessment).length;
  }, [userResults]);

  const usersWithPeerAssessment = useMemo(() => {
    return userResults.filter(result => result.hasPeerAssessment).length;
  }, [userResults]);

  return {
    // State
    userResults,
    isLoading,
    error,
    expandedAspects,
    
    // Actions
    setUserResults,
    setLoading: setIsLoading,
    setError,
    toggleAspect,
    expandAllAspects,
    collapseAllAspects,
    
    // Computed values
    totalUsers,
    averageScore,
    highestScore,
    lowestScore,
    usersWithSupervisorAssessment,
    usersWithPeerAssessment,
  };
}

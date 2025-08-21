// src/types/assessment.ts
export interface User {
  id: string;
  full_name: string;
  email: string;
  position?: string;
  department?: string;
  avatar_url?: string;
}

export interface Comment {
  comment: string;
  assessor: string;
  rating: number;
}

export interface AspectResult {
  aspect: string;
  supervisorAverage: number | null;
  peerAverage: number | null;
  finalScore: number | null;
  totalFeedback: number;
  supervisorComments: Comment[];
  peerComments: Comment[];
}

export interface UserAssessmentResult {
  user: User;
  supervisorAverage: number | null;
  peerAverage: number | null;
  finalScore: number | null;
  totalFeedback: number;
  aspectResults: AspectResult[];
  hasSupervisorAssessment: boolean;
  hasPeerAssessment: boolean;
}

export interface AssessmentResponse {
  aspect: string;
  indicator: string;
  rating: number;
  comment?: string;
}

export interface AssessmentAssignment {
  id: string;
  assessor_id: string;
  assessee_id: string;
  period_id: string;
  is_completed: boolean;
  completed_at?: string;
}

export interface FeedbackResponse {
  id: string;
  assignment_id: string;
  aspect: string;
  indicator: string;
  rating: number;
  comment?: string;
  created_at: string;
  assignment: AssessmentAssignment & {
    assessor: User;
    assessee: User;
  };
}

export interface AssessmentPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface UserRole {
  user_id: string;
  role: 'admin' | 'supervisor' | 'user';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  results?: T[];
}

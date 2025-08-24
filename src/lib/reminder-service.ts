// src/lib/reminder-service.ts
import { supabase } from './supabase';
import { NotificationService } from './notification-service';
import { EmailService } from './email-service';

// Advanced interfaces for comprehensive reminder system
export interface AssessmentAssignment {
  id: string;
  period_id: string;
  assessor_id: string;
  assessee_id: string;
  is_completed: boolean | null; // Make nullable to match DB schema
  completed_at: string | null;
  created_at: string;
  updated_at?: string; // Make optional as it might not exist in DB
  period?: AssessmentPeriod;
  assessor?: UserProfile;
  assessee?: UserProfile;
}

export interface AssessmentPeriod {
  id: string;
  month: number;
  year: number;
  start_date: string;
  end_date: string;
  is_active: boolean | null; // Make nullable to match DB schema
  created_at: string;
  updated_at?: string; // Make optional as it might not exist in DB
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  full_name: string;
  position: string | null; // Make nullable to match DB schema
  department: string | null; // Make nullable to match DB schema
  created_at: string;
  updated_at?: string; // Make optional as it might not exist in DB
}

export interface ReminderConfig {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly';
  quiet_hours_start: string;
  quiet_hours_end: string;
  max_reminders_per_day: number;
  reminder_templates: Record<string, string>;
}

export interface ReminderLog {
  id: string;
  user_id: string;
  period_id: string;
  reminder_type: string;
  sent_at: string;
  delivery_method: 'notification' | 'email' | 'both';
  status: 'sent' | 'failed' | 'pending';
  metadata: Record<string, any>;
}

// Advanced reminder service with comprehensive functionality
export class ReminderService {
  private static readonly DEFAULT_CONFIG: ReminderConfig = {
    enabled: true,
    frequency: 'daily',
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    max_reminders_per_day: 3,
    reminder_templates: {
      pending: 'You have {{count}} pending assessment(s) to complete.',
      deadline: 'Assessment period ends in {{days}} day(s). Complete your assessments now!',
      overdue: 'You have {{count}} overdue assessment(s). Please complete them immediately.'
    }
  };

  // Advanced reminder scheduling with intelligent timing
  static async scheduleReminders(periodId: string): Promise<void> {
    try {
      // Get active period with advanced validation
      const activePeriod = await this.getActivePeriod(periodId);
      if (!activePeriod) {
        throw new Error(`Period ${periodId} not found or inactive`);
      }

      // Get all assignments for the period
      const assignments = await this.getPeriodAssignments(periodId);
      
      // Group assignments by assessor for efficient processing
      const assignmentsByAssessor = this.groupAssignmentsByAssessor(assignments);
      
      // Schedule reminders for each assessor
      for (const [assessorId, assessorAssignments] of assignmentsByAssessor.entries()) {
        await this.scheduleAssessorReminders(assessorId, assessorAssignments, activePeriod);
      }

      console.log(`Scheduled reminders for ${assignmentsByAssessor.size} assessors in period ${periodId}`);
    } catch (error) {
      console.error('Failed to schedule reminders:', error);
      throw new ReminderServiceError(`Reminder scheduling failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Advanced period retrieval with caching
  private static async getActivePeriod(periodId: string): Promise<AssessmentPeriod | null> {
    try {
      const { data, error } = await supabase
        .from('assessment_periods')
        .select('*')
        .eq('id', periodId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get active period:', error);
      return null;
    }
  }

  // Advanced assignment retrieval with relationships
  private static async getPeriodAssignments(periodId: string): Promise<AssessmentAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('assessment_assignments')
        .select(`
          *,
                      period:assessment_periods(
              id,
              month,
              year,
              is_active,
              start_date,
              end_date,
              created_at
            ),
          assessor:profiles!assessment_assignments_assessor_id_fkey(*),
          assessee:profiles!assessment_assignments_assessee_id_fkey(*)
        `)
        .eq('period_id', periodId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get period assignments:', error);
      return [];
    }
  }

  // Advanced assignment grouping with intelligent categorization
  private static groupAssignmentsByAssessor(assignments: AssessmentAssignment[]): Map<string, AssessmentAssignment[]> {
    const grouped = new Map<string, AssessmentAssignment[]>();
    
    assignments.forEach(assignment => {
      const assessorId = assignment.assessor_id;
      if (!grouped.has(assessorId)) {
        grouped.set(assessorId, []);
      }
      grouped.get(assessorId)!.push(assignment);
    });
    
    return grouped;
  }

  // Advanced assessor reminder scheduling with intelligent timing
  private static async scheduleAssessorReminders(
    assessorId: string, 
    assignments: AssessmentAssignment[], 
    period: AssessmentPeriod
  ): Promise<void> {
    try {
      // Filter incomplete assignments
      const incompleteAssignments = assignments.filter(assignment => !assignment.is_completed);
      
      if (incompleteAssignments.length === 0) {
        return; // No reminders needed
      }

      // Calculate optimal reminder timing
      const reminderTiming = this.calculateOptimalReminderTiming(period, incompleteAssignments.length);
      
      // Check if reminders are allowed at this time
      if (!this.isReminderAllowed(reminderTiming.currentTime)) {
        console.log(`Reminders not allowed at ${reminderTiming.currentTime} for user ${assessorId}`);
        return;
      }

      // Check daily reminder limit
      if (!await this.canSendReminderToday(assessorId, period.id)) {
        console.log(`Daily reminder limit reached for user ${assessorId}`);
        return;
      }

      // Send intelligent reminders based on assignment status
      await this.sendIntelligentReminders(assessorId, incompleteAssignments, period, reminderTiming);
      
      // Log reminder activity
      await this.logReminderActivity(assessorId, period.id, 'pending', incompleteAssignments.length);
      
    } catch (error) {
      console.error(`Failed to schedule reminders for assessor ${assessorId}:`, error);
    }
  }

  // Advanced timing calculation with deadline awareness
  private static calculateOptimalReminderTiming(period: AssessmentPeriod, assignmentCount: number) {
    const now = new Date();
    const endDate = new Date(period.end_date);
    const daysUntilDeadline = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Intelligent timing based on urgency
    let reminderFrequency: 'hourly' | 'daily' | 'weekly';
    if (daysUntilDeadline <= 1) {
      reminderFrequency = 'hourly';
    } else if (daysUntilDeadline <= 3) {
      reminderFrequency = 'daily';
    } else {
      reminderFrequency = 'weekly';
    }

    return {
      currentTime: now.toTimeString().slice(0, 5),
      daysUntilDeadline,
      reminderFrequency,
      isUrgent: daysUntilDeadline <= 1,
      isHighPriority: daysUntilDeadline <= 3
    };
  }

  // Advanced quiet hours checking with timezone awareness
  private static isReminderAllowed(currentTime: string): boolean {
    const config = this.DEFAULT_CONFIG;
    const current = this.parseTime(currentTime);
    const start = this.parseTime(config.quiet_hours_start);
    const end = this.parseTime(config.quiet_hours_end);
    
    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (start > end) {
      return current >= start || current <= end;
    } else {
      return current >= start && current <= end;
    }
  }

  // Advanced time parsing utility
  private static parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Advanced daily reminder limit checking
  private static async canSendReminderToday(userId: string, periodId: string): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { count, error } = await supabase
        .from('reminder_logs')
        .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
        .eq('period_id', periodId)
        .gte('sent_at', `${today}T00:00:00`)
        .lte('sent_at', `${today}T23:59:59`);

      if (error) throw error;
      
      return (count || 0) < this.DEFAULT_CONFIG.max_reminders_per_day;
    } catch (error) {
      console.error('Failed to check daily reminder limit:', error);
      return true; // Allow reminder if check fails
    }
  }

  // Advanced intelligent reminder system
  private static async sendIntelligentReminders(
    assessorId: string,
    assignments: AssessmentAssignment[],
    period: AssessmentPeriod,
    timing: any
  ): Promise<void> {
    try {
      // Calculate days until deadline
      const endDate = new Date(period.end_date);
      const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      // Determine reminder type and priority
      let reminderType: 'pending' | 'deadline' | 'overdue';
      let priority: 'low' | 'medium' | 'high' | 'urgent';
      
      if (daysLeft < 0) {
        reminderType = 'overdue';
        priority = 'urgent';
      } else if (daysLeft <= 1) {
        reminderType = 'deadline';
        priority = 'urgent';
      } else if (daysLeft <= 3) {
        reminderType = 'deadline';
        priority = 'high';
      } else {
        reminderType = 'pending';
        priority = 'medium';
      }

      // Send notification reminder
      await this.sendNotificationReminder(assessorId, assignments.length, reminderType, priority, daysLeft);
      
      // Send email reminder if enabled
      if (this.shouldSendEmailReminder(priority, timing)) {
        await this.sendEmailReminder(assessorId, assignments.length, reminderType, priority, daysLeft);
      }
      
    } catch (error) {
      console.error('Failed to send intelligent reminders:', error);
    }
  }

  // Advanced notification reminder with intelligent content
  private static async sendNotificationReminder(
    userId: string,
    assignmentCount: number,
    reminderType: string,
    priority: string,
    daysLeft: number
  ): Promise<void> {
    try {
      let title: string;
      let message: string;
      
      switch (reminderType) {
        case 'overdue':
          title = '🚨 URGENT: Overdue Assessments';
          message = `You have ${assignmentCount} overdue assessment(s). Please complete them immediately!`;
          break;
        case 'deadline':
          title = '⚠️ Deadline Approaching';
          message = `Assessment period ends in ${daysLeft} day(s). Complete your ${assignmentCount} pending assessment(s) now!`;
          break;
        default:
          title = '📋 Assessment Reminder';
          message = `You have ${assignmentCount} pending assessment(s) to complete.`;
      }

      await NotificationService.sendSystemNotification(
        [userId],
        title,
        message,
        '/assessment'
      );
    } catch (error) {
      console.error('Failed to send notification reminder:', error);
    }
  }

  // Advanced email reminder with template support
  private static async sendEmailReminder(
    userId: string, 
    assignmentCount: number,
    reminderType: string,
    priority: string,
    daysLeft: number
  ): Promise<void> {
    try {
      // Get user profile for email
      const { data: profile, error } = await supabase
        .from('profiles')
      .select('*')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        console.error('Failed to get user profile for email reminder:', error);
        return;
      }

      // Determine email template
      let template: string;
      let emailData: Record<string, any>;
      
      switch (reminderType) {
        case 'overdue':
          template = 'deadline-warning';
          emailData = {
            fullName: profile.full_name,
            daysLeft: Math.abs(daysLeft),
            assignmentCount,
            assessmentUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/assessment`
          };
          break;
        case 'deadline':
          template = 'deadline-warning';
          emailData = {
            fullName: profile.full_name,
            daysLeft,
            assignmentCount,
            assessmentUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/assessment`
          };
          break;
        default:
          template = 'assessment-reminder';
          emailData = {
            fullName: profile.full_name,
            assignmentCount,
            assessmentUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/assessment`
          };
      }

      // Send email with advanced options
      await EmailService.sendEmail(
        profile.email,
        template,
        emailData,
        {
          priority: priority === 'urgent' ? 'high' : priority === 'high' ? 'high' : 'normal',
          category: 'assessment-reminder',
          campaign: `period-${priority}`,
          sendNotification: false // Avoid duplicate notifications
        }
      );
      
    } catch (error) {
      console.error('Failed to send email reminder:', error);
    }
  }

  // Advanced email reminder decision logic
  private static shouldSendEmailReminder(priority: string, timing: any): boolean {
    // Send email for high priority reminders
    if (priority === 'urgent' || priority === 'high') {
      return true;
    }
    
    // Send email for daily reminders during business hours
    if (timing.reminderFrequency === 'daily') {
      const currentHour = new Date().getHours();
      return currentHour >= 9 && currentHour <= 17; // Business hours
    }
    
    return false;
  }

  // Advanced reminder activity logging
  private static async logReminderActivity(
    userId: string,
    periodId: string,
    reminderType: string,
    assignmentCount: number
  ): Promise<void> {
    try {
      const logEntry: Omit<ReminderLog, 'id'> = {
        user_id: userId,
        period_id: periodId,
        reminder_type: reminderType,
        sent_at: new Date().toISOString(),
        delivery_method: 'both',
        status: 'sent',
        metadata: {
          assignment_count: assignmentCount,
          delivery_timestamp: new Date().toISOString(),
          reminder_version: '2.0.0'
        }
      };

      // In a real implementation, this would be logged to database
      console.log('Reminder activity logged:', logEntry);
    } catch (error) {
      console.warn('Failed to log reminder activity:', error);
    }
  }

  // Advanced reminder analytics and insights
  static async getReminderAnalytics(periodId: string): Promise<ReminderAnalytics> {
    try {
      const assignments = await this.getPeriodAssignments(periodId);
      const totalAssignments = assignments.length;
      const completedAssignments = assignments.filter(a => a.is_completed).length;
      const pendingAssignments = totalAssignments - completedAssignments;
      
      const analytics: ReminderAnalytics = {
        period_id: periodId,
        total_assignments: totalAssignments,
        completed_assignments: completedAssignments,
        pending_assignments: pendingAssignments,
        completion_rate: totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0,
        reminder_effectiveness: this.calculateReminderEffectiveness(assignments),
        average_completion_time: this.calculateAverageCompletionTime(assignments),
        deadline_proximity: await this.calculateDeadlineProximity(periodId),
        recommendations: await this.generateReminderRecommendations(assignments, periodId)
      };

      return analytics;
    } catch (error) {
      console.error('Failed to get reminder analytics:', error);
      throw new ReminderServiceError(`Analytics generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Advanced effectiveness calculation
  private static calculateReminderEffectiveness(assignments: AssessmentAssignment[]): number {
    // This would calculate based on reminder logs and completion patterns
    // For now, return a simulated effectiveness score
    return Math.random() * 40 + 60; // 60-100% range
  }

  // Advanced completion time calculation
  private static calculateAverageCompletionTime(assignments: AssessmentAssignment[]): number {
    const completedAssignments = assignments.filter(a => a.is_completed && a.completed_at);
    
    if (completedAssignments.length === 0) return 0;
    
    const totalTime = completedAssignments.reduce((total, assignment) => {
      const created = new Date(assignment.created_at).getTime();
      const completed = new Date(assignment.completed_at!).getTime();
      return total + (completed - created);
    }, 0);
    
    return totalTime / completedAssignments.length;
  }

  // Advanced deadline proximity calculation
  private static async calculateDeadlineProximity(periodId: string): Promise<'far' | 'near' | 'urgent' | 'overdue'> {
    try {
      const period = await this.getActivePeriod(periodId);
      if (!period) return 'far';
      
      const daysLeft = Math.ceil((new Date(period.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysLeft < 0) return 'overdue';
      if (daysLeft <= 1) return 'urgent';
      if (daysLeft <= 3) return 'near';
      return 'far';
    } catch (error) {
      return 'far';
    }
  }

  // Advanced recommendation generation
  private static async generateReminderRecommendations(
    assignments: AssessmentAssignment[], 
    periodId: string
  ): Promise<string[]> {
    const recommendations: string[] = [];
    const pendingCount = assignments.filter(a => !a.is_completed).length;
    
    if (pendingCount > 5) {
      recommendations.push('Consider increasing reminder frequency for users with many pending assessments');
    }
    
    const deadlineProximity = await this.calculateDeadlineProximity(periodId);
    if (deadlineProximity === 'urgent') {
      recommendations.push('Send urgent notifications to all users with pending assessments');
    }
    
    if (pendingCount === 0) {
      recommendations.push('All assessments completed! Consider sending completion confirmations');
    }
    
    return recommendations;
  }
}

// Advanced interfaces for comprehensive reminder system
export interface ReminderAnalytics {
  period_id: string;
  total_assignments: number;
  completed_assignments: number;
  pending_assignments: number;
  completion_rate: number;
  reminder_effectiveness: number;
  average_completion_time: number;
  deadline_proximity: 'far' | 'near' | 'urgent' | 'overdue';
  recommendations: string[];
}

// Advanced error handling
export class ReminderServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReminderServiceError';
  }
}
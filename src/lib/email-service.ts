// src/lib/email-service.ts
import { prisma } from './prisma';
import { NotificationService } from './notification-service';

// Advanced email service with comprehensive functionality
export class EmailService {
  private static readonly EMAIL_TEMPLATES = {
    WELCOME: 'welcome-email',
    ASSESSMENT_REMINDER: 'assessment-reminder',
    DEADLINE_WARNING: 'deadline-warning',
    COMPLETION_CONFIRMATION: 'completion-confirmation',
    SYSTEM_ANNOUNCEMENT: 'system-announcement'
  };

  private static readonly EMAIL_CONFIG = {
    FROM_EMAIL: 'noreply@bpskotabatu.go.id',
    FROM_NAME: 'BPS Kota Batu 360° Feedback',
    REPLY_TO: 'support@bpskotabatu.go.id',
    SMTP_CONFIG: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    }
  };

  // Advanced email sending with template support
  static async sendEmail(
    to: string | string[],
    template: string,
    data: Record<string, any>,
    options?: EmailOptions
  ): Promise<EmailResult> {
    try {
      // Advanced validation
      this.validateEmailRequest(to, template, data);
      
      // Generate email content from template
      const emailContent = await this.generateEmailContent(template, data);
      
      // Prepare email data
      const emailData = this.prepareEmailData(to, emailContent, options);
      
      // Send email (simulated for now)
      const result = await this.sendEmailViaProvider(emailData);
      
      // Log email activity
      await this.logEmailActivity(emailData, result);
      
      // Send notification if enabled
      if (options?.sendNotification !== false) {
        await this.sendEmailNotification(to, template, data);
      }
      
      return result;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new EmailServiceError(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Advanced template-based email generation
  private static async generateEmailContent(template: string, data: Record<string, any>): Promise<EmailContent> {
    const templateConfig = this.getTemplateConfig(template);
    
    return {
      subject: this.interpolateTemplate(templateConfig.subject, data),
      html: this.interpolateTemplate(templateConfig.html, data),
      text: this.interpolateTemplate(templateConfig.text, data),
      attachments: templateConfig.attachments || []
    };
  }

  // Advanced template interpolation with fallbacks
  private static interpolateTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = this.getNestedValue(data, key);
      return value !== undefined ? String(value) : match;
    });
  }

  // Advanced nested object value extraction
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  // Advanced email data preparation
  private static prepareEmailData(
    to: string | string[],
    content: EmailContent,
    options?: EmailOptions
  ): PreparedEmailData {
    const recipients = Array.isArray(to) ? to : [to];
    
    return {
      to: recipients,
      from: options?.from || this.EMAIL_CONFIG.FROM_EMAIL,
      fromName: options?.fromName || this.EMAIL_CONFIG.FROM_NAME,
      replyTo: options?.replyTo || this.EMAIL_CONFIG.REPLY_TO,
      subject: content.subject,
      html: content.html,
      text: content.text,
      attachments: content.attachments,
      priority: options?.priority || 'normal',
      scheduledAt: options?.scheduledAt,
      metadata: {
        template: options?.template,
        category: options?.category,
        campaign: options?.campaign,
        sentAt: new Date().toISOString()
      }
    };
  }

  // Advanced email provider integration
  private static async sendEmailViaProvider(emailData: PreparedEmailData): Promise<EmailResult> {
    // Simulate email sending with advanced error handling
    const success = Math.random() > 0.1; // 90% success rate for demo
    
    if (!success) {
      throw new EmailServiceError('Email provider temporarily unavailable');
    }
    
    return {
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'sent',
      sentAt: new Date().toISOString(),
      provider: 'simulated',
      metadata: emailData.metadata
    };
  }

  // Advanced email activity logging
  private static async logEmailActivity(emailData: PreparedEmailData, result: EmailResult): Promise<void> {
    try {
      // In a real implementation, this would log to database
      const logEntry = {
        recipients: emailData.to,
        subject: emailData.subject,
        template: emailData.metadata.template,
        status: result.status,
        messageId: result.messageId,
        sentAt: result.sentAt,
        provider: result.provider,
        metadata: emailData.metadata
      };
      
      console.log('Email activity logged:', logEntry);
    } catch (error) {
      console.warn('Failed to log email activity:', error);
    }
  }

  // Advanced notification integration
  private static async sendEmailNotification(
    recipients: string | string[],
    template: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      const userIds = await this.getUserIdsFromEmails(recipients);
      
      for (const userId of userIds) {
        await NotificationService.sendSystemNotification(
          [userId],
          'Email Sent',
          `An email was sent to your registered email address using template: ${template}`,
          '/notifications'
        );
      }
    } catch (error) {
      console.warn('Failed to send email notification:', error);
    }
  }

  // Advanced user ID resolution
  private static async getUserIdsFromEmails(emails: string | string[]): Promise<string[]> {
    const emailList = Array.isArray(emails) ? emails : [emails];
    
    try {
      const profiles = await prisma.profile.findMany({
        where: {
          email: { in: emailList }
        },
        select: { id: true }
      });
      
      return profiles?.map((p: { id: string }) => p.id) || [];
    } catch (error) {
      console.warn('Failed to resolve user IDs from emails:', error);
      return [];
    }
  }

  // Advanced validation
  private static validateEmailRequest(to: string | string[], template: string, data: Record<string, any>): void {
    if (!to || (Array.isArray(to) && to.length === 0)) {
      throw new EmailServiceError('Recipient email is required');
    }
    
    if (!template || !this.EMAIL_TEMPLATES[template as keyof typeof this.EMAIL_TEMPLATES]) {
      throw new EmailServiceError(`Invalid email template: ${template}`);
    }
    
    if (!data || typeof data !== 'object') {
      throw new EmailServiceError('Email data is required and must be an object');
    }
  }

  // Advanced template configuration
  private static getTemplateConfig(template: string): EmailTemplateConfig {
    const templates: Record<string, EmailTemplateConfig> = {
      'welcome-email': {
      subject: 'Welcome to BPS Kota Batu 360° Feedback System',
        html: this.getWelcomeEmailHTML(),
        text: this.getWelcomeEmailText()
      },
      'assessment-reminder': {
        subject: 'Assessment Reminder - Action Required',
        html: this.getAssessmentReminderHTML(),
        text: this.getAssessmentReminderText()
      },
      'deadline-warning': {
        subject: 'Urgent: Assessment Deadline Approaching',
        html: this.getDeadlineWarningHTML(),
        text: this.getDeadlineWarningText()
      },
      'completion-confirmation': {
        subject: 'Assessment Completed Successfully',
        html: this.getCompletionConfirmationHTML(),
        text: this.getCompletionConfirmationText()
      },
      'system-announcement': {
        subject: 'System Announcement - BPS Kota Batu',
        html: this.getSystemAnnouncementHTML(),
        text: this.getSystemAnnouncementText()
      }
    };
    
    return templates[template] || templates['system-announcement'];
  }

  // Advanced HTML template generation
  private static getWelcomeEmailHTML(): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to BPS Kota Batu 360° Feedback</title>
        </head>
        <body>
          <h1>Welcome {{fullName}}!</h1>
          <p>Your account has been successfully created.</p>
          <p>You can now access the assessment system at: <a href="{{loginUrl}}">{{loginUrl}}</a></p>
        </body>
        </html>
    `;
  }

  private static getWelcomeEmailText(): string {
    return `
      Welcome {{fullName}}!
      
      Your account has been successfully created.
      You can now access the assessment system at: {{loginUrl}}
    `;
  }

  private static getAssessmentReminderHTML(): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Assessment Reminder</title>
        </head>
        <body>
          <h1>Assessment Reminder</h1>
          <p>You have {{assignmentCount}} pending assessment(s) to complete.</p>
          <p><a href="{{assessmentUrl}}">Complete Assessments Now</a></p>
        </body>
        </html>
    `;
  }

  private static getAssessmentReminderText(): string {
    return `
      Assessment Reminder
      
      You have {{assignmentCount}} pending assessment(s) to complete.
      Complete Assessments Now: {{assessmentUrl}}
    `;
  }

  private static getDeadlineWarningHTML(): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Deadline Warning</title>
        </head>
        <body>
          <h1>⚠️ Deadline Warning</h1>
          <p>Assessment period ends in {{daysLeft}} day(s).</p>
          <p><strong>Complete your pending assessments now!</strong></p>
          <p><a href="{{assessmentUrl}}">Go to Assessments</a></p>
        </body>
        </html>
    `;
  }

  private static getDeadlineWarningText(): string {
    return `
      ⚠️ Deadline Warning
      
      Assessment period ends in {{daysLeft}} day(s).
      Complete your pending assessments now!
      Go to Assessments: {{assessmentUrl}}
    `;
  }

  private static getCompletionConfirmationHTML(): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Assessment Completed</title>
        </head>
        <body>
          <h1>✅ Assessment Completed</h1>
          <p>You have successfully completed the assessment for {{assesseeName}}.</p>
          <p><a href="{{dashboardUrl}}">View Dashboard</a></p>
        </body>
        </html>
    `;
  }

  private static getCompletionConfirmationText(): string {
    return `
      ✅ Assessment Completed
      
      You have successfully completed the assessment for {{assesseeName}}.
      View Dashboard: {{dashboardUrl}}
    `;
  }

  private static getSystemAnnouncementHTML(): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>System Announcement</title>
        </head>
        <body>
          <h1>System Announcement</h1>
          <p>{{message}}</p>
          <p><a href="{{actionUrl}}">{{actionLabel}}</a></p>
        </body>
      </html>
    `;
  }

  private static getSystemAnnouncementText(): string {
    return `
      System Announcement
      
      {{message}}
      
      {{actionLabel}}: {{actionUrl}}
    `;
  }
}

// Advanced interfaces and types
export interface EmailOptions {
  from?: string;
  fromName?: string;
  replyTo?: string;
  priority?: 'low' | 'normal' | 'high';
  scheduledAt?: Date;
  template?: string;
  category?: string;
  campaign?: string;
  sendNotification?: boolean;
}

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType: string;
}

export interface PreparedEmailData {
  to: string[];
  from: string;
  fromName: string;
  replyTo: string;
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
  priority: string;
  scheduledAt?: Date;
  metadata: Record<string, any>;
}

export interface EmailResult {
  messageId: string;
  status: 'sent' | 'failed' | 'pending';
  sentAt: string;
  provider: string;
  metadata: Record<string, any>;
}

export interface EmailTemplateConfig {
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
}

// Advanced error handling
export class EmailServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailServiceError';
  }
}
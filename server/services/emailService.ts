import fs from 'fs';
import path from 'path';
import { storage } from '../storage';
import sgMail from '@sendgrid/mail';

export interface EmailTemplate {
  subject: string;
  body: string;
}

export interface EmailData {
  recipientName: string;
  recipientEmail: string;
  complaintId: string;
  status: string;
  priority: string;
  problemType: string;
  submissionDate: string;
  lastUpdated: string;
  assignedStaff: string;
  updateDescription: string;
  actionRequired?: boolean;
  actionDescription?: string;
  actionUrl?: string;
  nextSteps?: string;
}

export class EmailService {
  private templatePath: string;
  private template: string;
  private isConfigured: boolean;

  constructor() {
    this.templatePath = path.join(process.cwd(), 'email_template_sample.html');
    this.loadTemplate();
    this.initializeSendGrid();
  }

  private initializeSendGrid(): void {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.isConfigured = true;
      console.log('SendGrid initialized successfully');
    } else {
      this.isConfigured = false;
      console.log('SendGrid API key not found. Email notifications will be logged only.');
    }
  }

  private loadTemplate(): void {
    try {
      this.template = fs.readFileSync(this.templatePath, 'utf8');
    } catch (error) {
      console.error('Failed to load email template:', error);
      this.template = this.getDefaultTemplate();
    }
  }

  private getDefaultTemplate(): string {
    return `
      <html>
        <body>
          <h2>ORCAA Complaint Management System</h2>
          <p>Dear {{recipientName}},</p>
          <p>Your complaint {{complaintId}} has been updated.</p>
          <p>Status: {{status}}</p>
          <p>{{updateDescription}}</p>
          <p>Thank you,<br>ORCAA Staff</p>
        </body>
      </html>
    `;
  }

  public generateEmail(data: EmailData, emailType: string): EmailTemplate {
    let subject = '';
    let body = this.template;

    // Set subject based on email type
    switch (emailType) {
      case 'complaint_received':
        subject = `New Air Quality Complaint ${data.complaintId} - ORCAA`;
        break;
      case 'status_update':
        subject = `Complaint Update ${data.complaintId} - ${data.status} - ORCAA`;
        break;
      case 'action_required':
        subject = `Action Required ${data.complaintId} - ORCAA`;
        break;
      case 'complaint_resolved':
        subject = `Complaint Resolved ${data.complaintId} - ORCAA`;
        break;
      case 'assignment_notification':
        subject = `Task Assignment ${data.complaintId} - ORCAA`;
        break;
      default:
        subject = `Complaint Notification ${data.complaintId} - ORCAA`;
    }

    // Replace template variables
    body = this.replaceTemplateVariables(body, data);

    return {
      subject,
      body
    };
  }

  private replaceTemplateVariables(template: string, data: EmailData): string {
    let result = template;

    // Replace all template variables
    result = result.replace(/\{\{recipientName\}\}/g, data.recipientName);
    result = result.replace(/\{\{complaintId\}\}/g, data.complaintId);
    result = result.replace(/\{\{status\}\}/g, data.status);
    result = result.replace(/\{\{priority\}\}/g, data.priority);
    result = result.replace(/\{\{problemType\}\}/g, data.problemType);
    result = result.replace(/\{\{submissionDate\}\}/g, data.submissionDate);
    result = result.replace(/\{\{lastUpdated\}\}/g, data.lastUpdated);
    result = result.replace(/\{\{assignedStaff\}\}/g, data.assignedStaff);
    result = result.replace(/\{\{updateDescription\}\}/g, data.updateDescription);
    result = result.replace(/\{\{nextSteps\}\}/g, data.nextSteps || '');

    // Handle conditional sections
    if (data.actionRequired) {
      result = result.replace(/\{\{#if actionRequired\}\}/g, '');
      result = result.replace(/\{\{\/if\}\}/g, '');
      result = result.replace(/\{\{actionDescription\}\}/g, data.actionDescription || '');
      result = result.replace(/\{\{actionUrl\}\}/g, data.actionUrl || '#');
    } else {
      // Remove action required section if not needed
      result = result.replace(/\{\{#if actionRequired\}\}[\s\S]*?\{\{\/if\}\}/g, '');
    }

    // Handle next steps conditional
    if (data.nextSteps) {
      result = result.replace(/\{\{#if nextSteps\}\}/g, '');
      result = result.replace(/\{\{\/if\}\}/g, '');
    } else {
      result = result.replace(/\{\{#if nextSteps\}\}[\s\S]*?\{\{\/if\}\}/g, '');
    }

    // Set CSS classes for status and priority
    result = result.replace(/\{\{statusClass\}\}/g, this.getStatusClass(data.status));
    result = result.replace(/\{\{priorityClass\}\}/g, this.getPriorityClass(data.priority));

    return result;
  }

  private getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'new':
      case 'initiated':
        return 'new';
      case 'in progress':
      case 'work in progress':
        return 'in-progress';
      case 'resolved':
      case 'completed':
        return 'resolved';
      default:
        return 'new';
    }
  }

  private getPriorityClass(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'high':
      case 'urgent':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return 'medium';
    }
  }

  // Method to send email using SendGrid
  public async sendEmail(emailData: EmailData, emailType: string): Promise<boolean> {
    try {
      const { subject, body } = this.generateEmail(emailData, emailType);
      
      // Log the email for debugging
      console.log('Preparing to send email:');
      console.log('To:', emailData.recipientEmail);
      console.log('Subject:', subject);
      console.log('Body preview:', body.substring(0, 200) + '...');

      if (!this.isConfigured) {
        console.log('SendGrid not configured. Email not sent.');
        return false;
      }

      // Send email using SendGrid
      const msg = {
        to: emailData.recipientEmail,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || 'venkat.naga@uzvis.com',
          name: 'ORCAA Complaint Management System'
        },
        subject: subject,
        html: body,
      };

      await sgMail.send(msg);
      console.log('Email sent successfully via SendGrid');
      
      // Create audit trail entry
      await storage.createAuditEntry({
        action: `Email sent: ${emailType}`,
        userId: null, // Use null instead of 'system' for foreign key constraint
        complaintId: parseInt(emailData.complaintId.split('-')[2]) || null,
        newValue: `Email sent to ${emailData.recipientEmail} - ${subject}`
      });

      return true;
    } catch (error: any) {
      console.error('Failed to send email:', error);
      
      // Log detailed error information
      if (error.response && error.response.body && error.response.body.errors) {
        console.error('SendGrid error details:', JSON.stringify(error.response.body.errors, null, 2));
      }
      
      // Log error in audit trail
      await storage.createAuditEntry({
        action: `Email send failed: ${emailType}`,
        userId: null,
        complaintId: parseInt(emailData.complaintId.split('-')[2]) || null,
        newValue: `Failed to send email to ${emailData.recipientEmail} - ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      
      return false;
    }
  }
}

export const emailService = new EmailService();
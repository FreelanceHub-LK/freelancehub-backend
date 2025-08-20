import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

export interface EmailTemplate {
  subject: string;
  template: string;
  data: Record<string, any>;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: any[];
  template?: string;
  templateData?: Record<string, any>;
}

@Injectable()
export class EmailService {
  private transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly templatesPath = path.join(process.cwd(), 'src', 'templates', 'email');

  constructor(private configService: ConfigService) {
    // Initialize email transporter
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST') || 'smtp.gmail.com',
      port: this.configService.get('SMTP_PORT') || 587,
      secure: this.configService.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });

    // Verify transporter configuration
    this.verifyTransporter();
  }

  private async verifyTransporter() {
    try {
      await this.transporter.verify();
      this.logger.log('Email transporter verified successfully');
    } catch (error) {
      this.logger.error('Email transporter verification failed:', error.message);
    }
  }

  private async loadTemplate(templateName: string): Promise<string> {
    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.hbs`);
      return fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      this.logger.error(`Failed to load template ${templateName}:`, error.message);
      throw new Error(`Template ${templateName} not found`);
    }
  }

  private compileTemplate(template: string, data: Record<string, any>): string {
    const compiledTemplate = handlebars.compile(template);
    return compiledTemplate(data);
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      let html = options.html;

      // If template is specified, compile it
      if (options.template && options.templateData) {
        const templateSource = await this.loadTemplate(options.template);
        html = this.compileTemplate(templateSource, options.templateData);
      }

      const mailOptions = {
        from: `"${this.configService.get('FROM_NAME', 'FreelanceHub')}" <${this.configService.get('FROM_EMAIL')}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html,
        text: options.text,
        attachments: options.attachments,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error.message);
      throw error;
    }
  }

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    const appName = this.configService.get('FROM_NAME', 'FreelanceHub');

    await this.sendEmail({
      to,
      subject: `Your ${appName} Verification Code`,
      template: 'otp-verification',
      templateData: {
        appName,
        otp,
        expiryMinutes: 10,
      },
    });
  }

  async sendWelcomeEmail(to: string, userData: { name: string; userType: string }): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Welcome to FreelanceHub!',
      template: 'welcome',
      templateData: {
        userName: userData.name,
        userType: userData.userType,
        loginUrl: `${this.configService.get('FRONTEND_URL', 'http://localhost:3000')}/login`,
        supportEmail: this.configService.get('SUPPORT_EMAIL', 'support@freelancehub.com'),
      },
    });
  }

  async sendProjectNotification(to: string, data: {
    userName: string;
    projectTitle: string;
    notificationType: 'new_proposal' | 'proposal_accepted' | 'project_completed' | 'milestone_completed';
    projectUrl: string;
  }): Promise<void> {
    const subjects = {
      new_proposal: `New proposal received for "${data.projectTitle}"`,
      proposal_accepted: `Your proposal for "${data.projectTitle}" has been accepted!`,
      project_completed: `Project "${data.projectTitle}" has been completed`,
      milestone_completed: `Milestone completed for "${data.projectTitle}"`,
    };

    await this.sendEmail({
      to,
      subject: subjects[data.notificationType],
      template: 'project-notification',
      templateData: {
        ...data,
        dashboardUrl: `${this.configService.get('FRONTEND_URL', 'http://localhost:3000')}/dashboard`,
      },
    });
  }

  async sendPaymentNotification(to: string, data: {
    userName: string;
    amount: number;
    currency: string;
    paymentType: 'payment_received' | 'payment_sent' | 'escrow_released' | 'refund_processed';
    transactionId: string;
  }): Promise<void> {
    const subjects = {
      payment_received: `Payment of ${data.currency} ${data.amount} received`,
      payment_sent: `Payment of ${data.currency} ${data.amount} sent successfully`,
      escrow_released: `Escrow payment of ${data.currency} ${data.amount} released`,
      refund_processed: `Refund of ${data.currency} ${data.amount} processed`,
    };

    await this.sendEmail({
      to,
      subject: subjects[data.paymentType],
      template: 'payment-notification',
      templateData: {
        ...data,
        paymentsUrl: `${this.configService.get('FRONTEND_URL', 'http://localhost:3000')}/payments`,
      },
    });
  }

  async sendContractNotification(to: string, data: {
    userName: string;
    contractTitle: string;
    notificationType: 'contract_created' | 'contract_signed' | 'contract_completed' | 'contract_cancelled';
    contractUrl: string;
  }): Promise<void> {
    const subjects = {
      contract_created: `New contract created: "${data.contractTitle}"`,
      contract_signed: `Contract signed: "${data.contractTitle}"`,
      contract_completed: `Contract completed: "${data.contractTitle}"`,
      contract_cancelled: `Contract cancelled: "${data.contractTitle}"`,
    };

    await this.sendEmail({
      to,
      subject: subjects[data.notificationType],
      template: 'contract-notification',
      templateData: data,
    });
  }

  async sendMessageNotification(to: string, data: {
    userName: string;
    senderName: string;
    messagePreview: string;
    conversationUrl: string;
  }): Promise<void> {
    await this.sendEmail({
      to,
      subject: `New message from ${data.senderName}`,
      template: 'message-notification',
      templateData: data,
    });
  }

  async sendDisputeNotification(to: string, data: {
    userName: string;
    disputeTitle: string;
    notificationType: 'dispute_opened' | 'dispute_resolved' | 'dispute_escalated';
    disputeUrl: string;
  }): Promise<void> {
    const subjects = {
      dispute_opened: `Dispute opened: "${data.disputeTitle}"`,
      dispute_resolved: `Dispute resolved: "${data.disputeTitle}"`,
      dispute_escalated: `Dispute escalated: "${data.disputeTitle}"`,
    };

    await this.sendEmail({
      to,
      subject: subjects[data.notificationType],
      template: 'dispute-notification',
      templateData: data,
    });
  }

  async sendReviewNotification(to: string, data: {
    userName: string;
    reviewerName: string;
    projectTitle: string;
    rating: number;
    reviewUrl: string;
  }): Promise<void> {
    await this.sendEmail({
      to,
      subject: `New review received for "${data.projectTitle}"`,
      template: 'review-notification',
      templateData: data,
    });
  }

  async sendPasswordResetEmail(to: string, data: {
    userName: string;
    resetToken: string;
  }): Promise<void> {
    const resetUrl = `${this.configService.get('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token=${data.resetToken}`;

    await this.sendEmail({
      to,
      subject: 'Password Reset Request',
      template: 'password-reset',
      templateData: {
        userName: data.userName,
        resetUrl,
        expiryHours: 1,
      },
    });
  }

  async sendBulkEmail(recipients: string[], options: Omit<EmailOptions, 'to'>): Promise<void> {
    const promises = recipients.map(recipient =>
      this.sendEmail({ ...options, to: recipient })
    );

    try {
      await Promise.allSettled(promises);
      this.logger.log(`Bulk email sent to ${recipients.length} recipients`);
    } catch (error) {
      this.logger.error('Failed to send bulk email:', error.message);
      throw error;
    }
  }
}

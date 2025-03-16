import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor(private configService: ConfigService) {
    // In production, you would use actual SMTP credentials
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('EMAIL_HOST') || 'smtp.example.com',
      port: this.configService.get('EMAIL_PORT') || 587,
      secure: this.configService.get('EMAIL_SECURE') === 'true',
      auth: {
        user: this.configService.get('EMAIL_USER') || 'user@example.com',
        pass: this.configService.get('EMAIL_PASSWORD') || 'password',
      },
    });
  }

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    const appName = this.configService.get('APP_NAME') || 'Freelancer Platform';
    
    await this.transporter.sendMail({
      from: `"${appName}" <${this.configService.get('EMAIL_FROM') || 'noreply@example.com'}>`,
      to,
      subject: `Your ${appName} Verification Code`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Thank you for registering with ${appName}. To complete your registration, please use the following verification code:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <p>Best regards,<br>${appName} Team</p>
        </div>
      `,
    });
  }
}
import sgMail from "@sendgrid/mail";
import { env } from "$env/dynamic/private";
import { nanoid } from "nanoid";

// Initialize SendGrid
if (env.SENDGRID_API_KEY) {
  sgMail.setApiKey(env.SENDGRID_API_KEY);
}

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static fromEmail =
    env.SENDGRID_FROM_EMAIL || "noreply@shieldauth.com";
  private static fromName = env.SENDGRID_FROM_NAME || "ShieldAuth";

  static async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      if (!env.SENDGRID_API_KEY) {
        console.warn("SendGrid API key not configured. Email not sent.");
        return false;
      }

      const msg = {
        to: template.to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: template.subject,
        html: template.html,
        text: template.text || template.html.replace(/<[^>]*>/g, ""),
      };

      await sgMail.send(msg);
      console.log(`Email sent successfully to ${template.to}`);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  static generateVerificationToken(): string {
    return nanoid(32);
  }

  static generatePasswordResetToken(): string {
    return nanoid(32);
  }

  static async sendEmailVerification(
    email: string,
    name: string,
    token: string,
    context: string = "registration"
  ): Promise<boolean> {
    const verificationUrl = `${
      env.PUBLIC_APP_URL || "http://localhost:5173"
    }/auth/verify-email?token=${token}&context=${context}`;

    const template: EmailTemplate = {
      to: email,
      subject: "Verify Your Email - ShieldAuth",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; }
            .button { 
              display: inline-block; 
              background: #1f2937; 
              color: #ffffff !important; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0;
              font-weight: 600;
            }
            .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ShieldAuth</h1>
            </div>
            <div class="content">
              <h2>Welcome to ShieldAuth, ${name}!</h2>
              <p>Thank you for signing up. To complete your registration and activate your account, please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #3b82f6;">${verificationUrl}</p>
              
              <p><strong>This link will expire in 24 hours.</strong></p>
              
              <p>If you didn't create an account with ShieldAuth, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© 2025 ShieldAuth. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to ShieldAuth, ${name}!
        
        Thank you for signing up. To complete your registration and activate your account, please verify your email address by visiting this link:
        
        ${verificationUrl}
        
        This link will expire in 24 hours.
        
        If you didn't create an account with ShieldAuth, please ignore this email.
        
        © 2025 ShieldAuth. All rights reserved.
      `,
    };

    return await this.sendEmail(template);
  }

  static async sendPasswordReset(
    email: string,
    name: string,
    token: string
  ): Promise<boolean> {
    const resetUrl = `${
      env.PUBLIC_APP_URL || "http://localhost:5173"
    }/auth/reset-password?token=${token}`;

    const template: EmailTemplate = {
      to: email,
      subject: "Reset Your Password - ShieldAuth",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; }
            .button { 
              display: inline-block; 
              background: #dc2626; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0;
            }
            .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
            .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ShieldAuth</h1>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>Hello ${name},</p>
              <p>We received a request to reset your password for your ShieldAuth account. If you made this request, click the button below to reset your password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #dc2626;">${resetUrl}</p>
              
              <div class="warning">
                <p><strong>Security Notice:</strong></p>
                <ul>
                  <li>This link will expire in 1 hour</li>
                  <li>If you didn't request this password reset, please ignore this email</li>
                  <li>Your password will remain unchanged until you create a new one</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>© 2025 ShieldAuth. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request
        
        Hello ${name},
        
        We received a request to reset your password for your ShieldAuth account. If you made this request, visit this link to reset your password:
        
        ${resetUrl}
        
        Security Notice:
        - This link will expire in 1 hour
        - If you didn't request this password reset, please ignore this email
        - Your password will remain unchanged until you create a new one
        
        © 2025 ShieldAuth. All rights reserved.
      `,
    };

    return await this.sendEmail(template);
  }

  static async sendPasswordResetConfirmation(
    email: string,
    name: string
  ): Promise<boolean> {
    const template: EmailTemplate = {
      to: email,
      subject: "Password Successfully Reset - ShieldAuth",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; }
            .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
            .success { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ShieldAuth</h1>
            </div>
            <div class="content">
              <h2>Password Successfully Reset</h2>
              <p>Hello ${name},</p>
              
              <div class="success">
                <p><strong>Your password has been successfully reset!</strong></p>
                <p>You can now log in to your ShieldAuth account using your new password.</p>
              </div>
              
              <p>If you didn't make this change, please contact our support team immediately.</p>
            </div>
            <div class="footer">
              <p>© 2025 ShieldAuth. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Successfully Reset
        
        Hello ${name},
        
        Your password has been successfully reset!
        
        You can now log in to your ShieldAuth account using your new password.
        
        If you didn't make this change, please contact our support team immediately.
        
        © 2025 ShieldAuth. All rights reserved.
      `,
    };

    return await this.sendEmail(template);
  }

  static async sendVerificationCode(
    email: string,
    name: string,
    code: string
  ): Promise<boolean> {
    const template: EmailTemplate = {
      to: email,
      subject: "Your Verification Code - ShieldAuth",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Code</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; }
            .code { 
              background: #1f2937; 
              color: #ffffff; 
              padding: 20px; 
              text-align: center; 
              border-radius: 8px; 
              margin: 20px 0;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
            }
            .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ShieldAuth</h1>
            </div>
            <div class="content">
              <h2>Your Verification Code</h2>
              <p>Hello ${name},</p>
              <p>Thank you for signing up! To complete your registration, please enter the following verification code:</p>
              
              <div class="code">${code}</div>
              
              <div class="warning">
                <p><strong>Important:</strong></p>
                <ul>
                  <li>This code will expire in 10 minutes</li>
                  <li>Enter this code on the verification page to complete your registration</li>
                  <li>If you didn't create an account with ShieldAuth, please ignore this email</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>© 2025 ShieldAuth. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Your Verification Code - ShieldAuth
        
        Hello ${name},
        
        Thank you for signing up! To complete your registration, please enter the following verification code:
        
        ${code}
        
        Important:
        - This code will expire in 10 minutes
        - Enter this code on the verification page to complete your registration
        - If you didn't create an account with ShieldAuth, please ignore this email
        
        © 2025 ShieldAuth. All rights reserved.
      `,
    };

    return await this.sendEmail(template);
  }

  // Send password reset code email
  static async sendPasswordResetCode(
    email: string,
    name: string,
    code: string
  ): Promise<boolean> {
    const template: EmailTemplate = {
      to: email,
      subject: "Your Password Reset Code - ShieldAuth",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Code</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; }
            .code { 
              background: #1f2937; 
              color: #ffffff; 
              padding: 20px; 
              text-align: center; 
              border-radius: 8px; 
              margin: 20px 0;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
            }
            .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ShieldAuth</h1>
            </div>
            <div class="content">
              <h2>Password Reset Code</h2>
              <p>Hello ${name},</p>
              <p>You requested to reset your password. Please enter the following verification code:</p>
              
              <div class="code">${code}</div>
              
              <div class="warning">
                <p><strong>Important:</strong></p>
                <ul>
                  <li>This code will expire in 10 minutes</li>
                  <li>Enter this code on the password reset page to continue</li>
                  <li>If you didn't request a password reset, please ignore this email</li>
                </ul>
              </div>
              
              <p>If you have any questions, please contact our support team.</p>
            </div>
            <div class="footer">
              <p>© 2025 ShieldAuth. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Code - ShieldAuth
        
        Hello ${name},
        
        You requested to reset your password. Please enter the following verification code:
        
        ${code}
        
        Important:
        - This code will expire in 10 minutes
        - Enter this code on the password reset page to continue
        - If you didn't request a password reset, please ignore this email
        
        © 2025 ShieldAuth. All rights reserved.
      `,
    };

    return await this.sendEmail(template);
  }

  // Send password change verification code email
  static async sendPasswordChangeCode(
    email: string,
    name: string,
    code: string
  ): Promise<boolean> {
    const template: EmailTemplate = {
      to: email,
      subject: "Your Password Change Verification Code - ShieldAuth",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Change Verification Code</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; }
            .code { 
              background: #1f2937; 
              color: #ffffff; 
              padding: 20px; 
              text-align: center; 
              border-radius: 8px; 
              margin: 20px 0;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
            }
            .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ShieldAuth</h1>
            </div>
            <div class="content">
              <h2>Password Change Verification Code</h2>
              <p>Hello ${name},</p>
              <p>You requested to change your password. Please enter the following verification code to confirm this action:</p>
              
              <div class="code">${code}</div>
              
              <div class="warning">
                <p><strong>Important:</strong></p>
                <ul>
                  <li>This code will expire in 10 minutes</li>
                  <li>Enter this code on the password change page to continue</li>
                  <li>If you didn't request a password change, please ignore this email and consider changing your password immediately</li>
                </ul>
              </div>
              
              <p>If you have any questions, please contact our support team.</p>
            </div>
            <div class="footer">
              <p>© 2025 ShieldAuth. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Change Verification Code - ShieldAuth
        
        Hello ${name},
        
        You requested to change your password. Please enter the following verification code to confirm this action:
        
        ${code}
        
        Important:
        - This code will expire in 10 minutes
        - Enter this code on the password change page to continue
        - If you didn't request a password change, please ignore this email and consider changing your password immediately
        
        © 2025 ShieldAuth. All rights reserved.
      `,
    };

    return await this.sendEmail(template);
  }
}

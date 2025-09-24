import nodemailer from 'nodemailer';

// Gmail configuration with App Password
let transporter;
if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
} else {
  transporter = {
    async sendMail(opts) {
      console.warn('Email disabled (missing GMAIL_USER/GMAIL_APP_PASSWORD). Would send:', {
        to: opts.to,
        subject: opts.subject
      });
    }
  };
}

export async function sendOTPEmail(email, otp) {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Email Verification OTP</h2>
        <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
          Thank you for signing up! To complete your registration, please use the following OTP to verify your email address.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background-color: #3b82f6; color: white; padding: 20px; border-radius: 10px; font-size: 32px; font-weight: bold; letter-spacing: 5px; display: inline-block; min-width: 200px;">
            ${otp}
          </div>
        </div>
        <p style="color: #666; line-height: 1.6; margin-bottom: 25px; text-align: center;">
          Enter this OTP in the verification form on our website.
        </p>
        <p style="color: #999; font-size: 14px; text-align: center; margin-top: 25px;">
          This OTP will expire in 10 minutes for security reasons.
        </p>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
          If you didn't create an account with us, please ignore this email.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Authenra" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Email Verification OTP - Authenra',
    html: htmlContent
  });
}

export async function sendVerificationEmail(email, token) {
  const url = `${process.env.BASE_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Verify Your Email Address</h2>
        <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
          Thank you for signing up! To complete your registration, please verify your email address by clicking the button below.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #999; font-size: 14px; text-align: center; margin-top: 25px;">
          If the button doesn't work, you can also copy and paste this link into your browser:<br>
          <a href="${url}" style="color: #3b82f6;">${url}</a>
        </p>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
          This link will expire in 24 hours for security reasons.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Authenra" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email Address - Authenra',
    html: htmlContent
  });
}

export async function sendPasswordResetEmail(email, token) {
  const url = `${process.env.BASE_URL || 'http://localhost:5173'}/reset-password/${token}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Reset Your Password</h2>
        <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
          You requested a password reset for your Authenra account. Click the button below to create a new password.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background-color: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #999; font-size: 14px; text-align: center; margin-top: 25px;">
          If you didn't request this password reset, you can safely ignore this email.<br>
          If the button doesn't work, you can also copy and paste this link into your browser:<br>
          <a href="${url}" style="color: #ef4444;">${url}</a>
        </p>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
          This link will expire in 1 hour for security reasons.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Authenra" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Reset Your Password - Authenra',
    html: htmlContent
  });
}

export async function sendWelcomeEmail(email, name) {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Welcome to Authenra! 🎉</h2>
        <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
          Hi ${name || 'there'}! Welcome to Authenra. Your account has been successfully created and verified.
        </p>
        <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
          You can now log in to your account and start using all the features we have to offer.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.BASE_URL || 'http://localhost:5173'}/login" style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Sign In Now
          </a>
        </div>
        <p style="color: #999; font-size: 14px; text-align: center; margin-top: 25px;">
          If you have any questions, feel free to reach out to our support team.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Authenra" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Welcome to Authenra!',
    html: htmlContent
  });
}
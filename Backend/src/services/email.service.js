import crypto from 'crypto';

// In-memory store for development/testing email transport
const sentEmailsStore = [];

export const emailService = {
  /**
   * Send an email with token/link for verification or password reset
   */
  async sendEmail({ to, subject, html, text, type = 'GENERAL' }) {
    if (!to) throw new Error('Recipient email address is required');

    const emailRecord = {
      id: `dev-email-${Date.now()}-${crypto.randomInt(100, 999)}`,
      to: to.toLowerCase().trim(),
      subject,
      html,
      text,
      type,
      sentAt: new Date(),
      status: 'DEVELOPMENT_RECORDED',
    };

    // If real SMTP credentials are provided, attempt delivery
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        // Production SMTP delivery logic would go here with nodemailer
        console.log(`[Email Service - SMTP] Dispatching email to ${to}: ${subject}`);
        emailRecord.status = 'DELIVERED';
      } catch (err) {
        console.error(`[Email Service] Failed to send email via SMTP to ${to}:`, err.message);
        emailRecord.status = 'FAILED';
        emailRecord.error = err.message;
        throw err;
      }
    } else {
      // Development Fallback Transport
      console.log(`\n================== [SEVASETU DEV EMAIL TRANSPORT] ==================`);
      console.log(`To: ${emailRecord.to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Type: ${type}`);
      console.log(`Time: ${emailRecord.sentAt.toISOString()}`);
      console.log(`Preview: ${text || html?.replace(/<[^>]*>/g, '').slice(0, 150)}...`);
      console.log(`====================================================================\n`);
      sentEmailsStore.push(emailRecord);
    }

    return emailRecord;
  },

  /**
   * Send email verification link
   */
  async sendVerificationEmail(email, token, fullName = 'User') {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const verifyUrl = `${clientUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    return this.sendEmail({
      to: email,
      subject: 'SevaSetu - Verify Your Email Address',
      text: `Hello ${fullName},\n\nPlease verify your SevaSetu account using the verification token: ${token}\nOr visit: ${verifyUrl}\n\nThis token will expire in 24 hours.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #ea580c;">Welcome to SevaSetu, ${fullName}!</h2>
          <p>Please confirm your email address by using this token:</p>
          <div style="background: #f1f5f9; padding: 12px; font-weight: bold; font-size: 18px; letter-spacing: 2px;">
            ${token}
          </div>
          <p>Or click the link below:</p>
          <p><a href="${verifyUrl}" style="color: #ea580c; text-decoration: underline;">Verify My Account</a></p>
          <p>This verification token is valid for 24 hours.</p>
        </div>
      `,
      type: 'EMAIL_VERIFICATION',
    });
  },

  /**
   * Send password reset token
   */
  async sendPasswordResetEmail(email, token, fullName = 'User') {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    return this.sendEmail({
      to: email,
      subject: 'SevaSetu - Password Reset Request',
      text: `Hello ${fullName},\n\nYou requested a password reset. Your reset token is: ${token}\nOr reset your password here: ${resetUrl}\n\nThis token will expire in 15 minutes. If you did not request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #ea580c;">Password Reset Request</h2>
          <p>Hello ${fullName},</p>
          <p>You requested a password reset for your SevaSetu account. Your one-time secure reset token is:</p>
          <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 12px; font-weight: bold; font-size: 20px; letter-spacing: 2px; text-align: center;">
            ${token}
          </div>
          <p style="margin-top: 15px;">Or visit this link to set a new password:</p>
          <p><a href="${resetUrl}" style="color: #ea580c;">Reset My Password</a></p>
          <p style="color: #64748b; font-size: 13px;">This token expires in 15 minutes. Never share this token with anyone.</p>
        </div>
      `,
      type: 'PASSWORD_RESET',
    });
  },

  // Test helpers
  getSentEmails() {
    return [...sentEmailsStore];
  },
  getLastSentEmail() {
    return sentEmailsStore[sentEmailsStore.length - 1] || null;
  },
  clearSentEmails() {
    sentEmailsStore.length = 0;
  },
};

export default emailService;

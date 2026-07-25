import crypto from 'crypto';
import getTransporter from '../config/email.js';
import env from '../config/env.js';

// ── Helpers ───────────────────────────────────────────────────────────────────
export const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

export const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

export const verifyHashedOtp = (plainOtp, hashedOtp) => {
  return crypto.createHash('sha256').update(plainOtp).digest('hex') === hashedOtp;
};

// ── Email OTP ─────────────────────────────────────────────────────────────────
export const sendEmailOtp = async (toEmail, otp, firstName = '') => {
  if (!env.GMAIL_APP_PASSWORD || !env.EMAIL_FROM) {
    throw new Error('GMAIL_APP_PASSWORD or EMAIL_FROM is not set in environment variables.');
  }

  await getTransporter().sendMail({
    from: `EventHub <${env.EMAIL_FROM}>`,
    to: toEmail,
    subject: 'Your EventHub verification code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Your verification code</h2>
        <p>Hi${firstName ? ` ${firstName}` : ''},</p>
        <p>Use the code below to complete your sign-in. It expires in <strong>10 minutes</strong>.</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; text-align: center;
                    padding: 24px; background: #f4f4f4; border-radius: 8px; margin: 24px 0;">
          ${otp}
        </div>
        <p style="color: #888; font-size: 13px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
};

// ── SMS OTP ───────────────────────────────────────────────────────────────────
export const sendSmsOtp = async (toPhone, otp) => {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
    console.warn('Twilio credentials not set — skipping SMS OTP send');
    return;
  }

  const { default: twilio } = await import('twilio');
  const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

  await client.messages.create({
    body: `Your EventHub verification code is: ${otp}. It expires in 10 minutes.`,
    from: env.TWILIO_PHONE_NUMBER,
    to: toPhone,
  });
};

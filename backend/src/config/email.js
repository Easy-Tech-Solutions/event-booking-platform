import nodemailer from 'nodemailer';
import env from './env.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.EMAIL_FROM,
    pass: env.GMAIL_APP_PASSWORD,
  },
});

export default transporter;

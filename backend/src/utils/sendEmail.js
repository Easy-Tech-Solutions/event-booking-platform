import transporter from '../config/email.js';
import env from '../config/env.js';

const sendEmail = async (to, subject, html) => {
  await transporter.sendMail({
    from: `Event Hub <${env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  });
};

export { sendEmail };

import getTransporter from '../config/email.js';
import env from '../config/env.js';

const sendEmail = async (to, subject, html) => {
  await getTransporter().sendMail({
    from: `Event Hub <${env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  });
};

export { sendEmail };

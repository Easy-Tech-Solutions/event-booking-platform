import sgMail from "../config/email.js";
import env from "../config/env.js";

const sendEmail = async (to, subject, html) => {
  try {
    await sgMail.send({
      from: `Event Hub <${env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    throw new Error("Email could not be sent: " + error.message);
  }
};
export { sendEmail };

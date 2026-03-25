import transporter from "../config/email.js";
import env from "../config/env.js";
const { EMAIL_USER } = env;

// ✅ FIX — wrap in try/catch properly
const sendEmail = async (to, subject, html) => {
  try {
    // ← add this
    await transporter.sendMail({
      from: `Event Hub <${EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    throw new Error("Email could not be sent: " + error.message);
  }
};
export { sendEmail };

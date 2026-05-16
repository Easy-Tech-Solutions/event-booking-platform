import transporter from "../config/email.js";
import env from "../config/env.js";
const { EMAIL_USER } = env;


const sendEmail = async (to, subject, html) => {
  try {
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

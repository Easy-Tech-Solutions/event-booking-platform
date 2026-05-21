import sgMail from "@sendgrid/mail";
import env from "./env.js";

sgMail.setApiKey(env.SENDGRID_API_KEY);

export default sgMail;

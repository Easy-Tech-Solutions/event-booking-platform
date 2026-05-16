import nodemailer from "nodemailer";
import env from "./env.js";

const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = env;

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: false,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

transporter.verify((err, success) => {
    if(err){
        console.error('Email config error:', err);
    } else {
        console.log('Email server ready');
    }
});

export default transporter;

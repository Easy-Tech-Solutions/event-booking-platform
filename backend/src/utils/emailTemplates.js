const verificationEmailTemplate = (firstName, verificationLink) => {
  return {
    subject: "Verify your Event Hub account",
    html: `
  <h2>Hi ${firstName},</h2>
  <p>Welcome to Event Hub! We're excited to have you.</p>
  <p>Please verify your email address to activate your account and start exploring events near you.</p>
  <a href="${verificationLink}">Verify My Account</a>
  <p>This link will expire in 24 hours.</p>
  <p>If you did not create an account with Event Hub, please ignore this email.</p>
  <p>Thanks,<br/>The Event Hub Team</p>
`,
  };
};

const resetPasswordEmailTemplate = (firstName, resetLink) => {  
  return {
    subject: "Reset your Event Hub Password",
    html: `
    <h2>Hi ${firstName},</h2>
    <p>We received a request to reset your Event Hub password.</p>
    <p>Click the link below to reset your password:</p>
    <a href="${resetLink}">Reset My Password</a>
    <p>This link will expire in 1 hour.</p>
    <p>If you did not request a password reset, please ignore this email.</p>
    <p>Thanks,<br/>The Event Hub Team</p>
    `,
  };
};
export { verificationEmailTemplate, resetPasswordEmailTemplate };

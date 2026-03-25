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

export { verificationEmailTemplate };

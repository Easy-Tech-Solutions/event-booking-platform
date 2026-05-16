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

const orderConfirmationEmailTemplate = ({
  firstName,
  orderNumber,
  eventTitle,
  eventDate,
  eventLocation,
  items,
  totalAmount,
  ticketCount,
}) => {
  const formattedDate = new Date(eventDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const itemsList = items
    .map((item) => `<li>${item.quantity}x ${item.ticketType?.name || "Ticket"} — $${item.price}</li>`)
    .join("");

  return {
    subject: `Order Confirmed — ${eventTitle}`,
    html: `
    <h2>Hi ${firstName},</h2>
    <p>Your order has been confirmed! 🎉</p>
    <hr/>
    <h3>Order Details</h3>
    <p><strong>Order Number:</strong> ${orderNumber}</p>
    <p><strong>Event:</strong> ${eventTitle}</p>
    <p><strong>Date:</strong> ${formattedDate}</p>
    <p><strong>Location:</strong> ${eventLocation?.venue || ""} ${eventLocation?.city || ""}</p>
    <hr/>
    <h3>Tickets</h3>
    <ul>${itemsList}</ul>
    <p><strong>Total Paid:</strong> $${totalAmount}</p>
    <p><strong>Tickets:</strong> ${ticketCount} ticket(s)</p>
    <hr/>
    <p>You can view your tickets in the Event Hub app under "My Tickets".</p>
    <p>Please present your QR code at the door for check-in.</p>
    <p>Thanks,<br/>The Event Hub Team</p>
    `,
  };
};

export {
  verificationEmailTemplate,
  resetPasswordEmailTemplate,
  orderConfirmationEmailTemplate,
};
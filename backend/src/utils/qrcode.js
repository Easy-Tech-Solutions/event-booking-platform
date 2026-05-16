import QRCode from "qrcode";

const generateQRCode = async (data) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      errorCorrectionLevel: "M",
      type: "image/png",
      quality: 0.92,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    return qrCodeDataURL;
  } catch (error) {
    throw new Error("Failed to generate QR code: " + error.message);
  }
};

const generateTicketQRData = (ticket) => {
  return JSON.stringify({
    ticketId: ticket._id,
    ticketNumber: ticket.ticketNumber,
    eventId: ticket.event,
    holderId: ticket.holder,
    timestamp: Date.now(),
  });
};

export { generateQRCode, generateTicketQRData };

import React from "react";
import QRCode from "qrcode.react";

export function TicketQRCode({ ticketId }) {
  const qrValue = `event-ticket:${ticketId}`;
  return (
    <div className="flex flex-col items-center">
      <QRCode value={qrValue} size={128} />
      <div className="mt-2 text-xs text-muted-foreground">Scan at event check-in</div>
      <a
        href={`data:image/png;base64,${btoa(qrValue)}`}
        download={`ticket-${ticketId}.png`}
        className="mt-2 text-sm text-green-700 underline"
      >
        Download QR Code
      </a>
    </div>
  );
}

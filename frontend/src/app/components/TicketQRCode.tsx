import { QRCodeSVG } from 'qrcode.react';

export function TicketQRCode({ ticketId }: { ticketId: string }) {
  return (
    <div className="flex flex-col items-center">
      <QRCodeSVG value={ticketId} size={160} level="M" />
      <div className="mt-2 text-xs text-muted-foreground font-mono">{ticketId}</div>
      <div className="mt-1 text-xs text-muted-foreground">Scan at event check-in</div>
    </div>
  );
}

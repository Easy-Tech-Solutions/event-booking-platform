import Ticket from '../models/Ticket.model.js';
import Event from '../models/Event.model.js';
import TrackingLink from '../models/TrackingLink.model.js';
import { generateQRCode, generateTicketQRData } from './qrcode.js';
import { notify } from './notify.js';
import { orderConfirmationEmailTemplate, ticketRecipientEmailTemplate } from './emailTemplates.js';
import logger from './logger.js';

/**
 * Shared ticket-generation and notification logic used by confirmOrder,
 * confirmMomoOrder, and the Stripe webhook.
 *
 * @param {object} order - Order document, populated with items.ticketType, event, user
 * @param {object} [ctx] - Context for unpopulated documents
 * @param {object} [ctx.eventDoc] - Event document when order.event is an ObjectId
 * @param {object} [ctx.userDoc]  - User document when order.user is an ObjectId
 * @returns {Promise<Ticket[]>}
 */
export const fulfillOrder = async (order, { eventDoc, userDoc } = {}) => {
  const eventId = (order.event?._id ?? order.event).toString();
  const userId = (order.user?._id ?? order.user ?? userDoc?._id).toString();
  const eventTitle = order.event?.title ?? eventDoc?.title ?? '';
  const eventDate = order.event?.startDate ?? eventDoc?.startDate;
  const eventLocation = order.event?.location ?? eventDoc?.location;
  const firstName = order.user?.firstName ?? userDoc?.firstName ?? '';
  const lastName = order.user?.lastName ?? userDoc?.lastName ?? '';
  const userEmail = order.user?.email ?? userDoc?.email ?? '';

  const tickets = [];
  let totalTicketsSold = 0;
  let grossRevenue = 0;

  for (const item of order.items) {
    const ticketTypeId = item.ticketType?._id ?? item.ticketType;
    if (!ticketTypeId) {
      logger.error(`fulfillOrder: order ${order._id} item missing ticketType — skipping`);
      continue;
    }
    const qty = Number(item.quantity) || 0;
    totalTicketsSold += qty;
    grossRevenue += (item.price || 0) * qty;

    for (let i = 0; i < qty; i++) {
      const ticket = new Ticket({
        order: order._id,
        event: eventId,
        ticketType: ticketTypeId,
        holder: userId,
      });
      await ticket.save();
      try {
        ticket.qrCode = await generateQRCode(generateTicketQRData(ticket));
        await ticket.save();
      } catch (qrErr) {
        logger.error(`fulfillOrder: QR generation failed for ticket ${ticket._id} — continuing without QR`, qrErr.message);
      }
      tickets.push(ticket);
    }
  }

  await Event.findByIdAndUpdate(eventId, {
    $inc: { soldTickets: totalTicketsSold, totalSales: grossRevenue },
  });

  if (order.trackingLink) {
    await TrackingLink.findByIdAndUpdate(order.trackingLink, {
      $inc: { orders: 1, revenue: grossRevenue },
    });
  }

  const hasRecipients = order.recipients?.length > 0;

  try {
    if (hasRecipients) {
      const senderName = `${firstName} ${lastName}`.trim() || firstName;
      for (let i = 0; i < tickets.length; i++) {
        const recipient = order.recipients[i];
        if (!recipient?.email) continue;
        const { subject, html } = ticketRecipientEmailTemplate({
          recipientName: recipient.name,
          senderName,
          eventTitle,
          eventDate,
          eventLocation,
          ticketNumber: tickets[i].ticketNumber,
          orderNumber: order.orderNumber,
        });
        await notify({
          userId,
          type: 'order_confirmed',
          title: 'Ticket sent!',
          message: `A ticket for "${eventTitle}" has been sent to ${recipient.name}.`,
          link: '/user/tickets',
          email: { to: recipient.email, subject, html },
        });
      }
      await notify({
        userId,
        type: 'order_confirmed',
        title: 'Booking confirmed!',
        message: `Your ${tickets.length} ticket(s) for "${eventTitle}" have been sent to recipients. Order #${order.orderNumber}.`,
        link: '/user/tickets',
        email: {
          to: userEmail,
          subject: `Booking confirmed — ${eventTitle}`,
          html: `<h2>Hi ${firstName},</h2><p>Your order #${order.orderNumber} has been confirmed. ${tickets.length} ticket(s) have been sent to the recipients you specified.</p><p>Thanks,<br/>The Event Hub Team</p>`,
        },
      });
    } else {
      const { subject, html } = orderConfirmationEmailTemplate({
        firstName,
        orderNumber: order.orderNumber,
        eventTitle,
        eventDate,
        eventLocation,
        items: order.items,
        totalAmount: order.totalAmount,
        ticketCount: tickets.length,
      });
      await notify({
        userId,
        type: 'order_confirmed',
        title: 'Booking confirmed!',
        message: `Your ${tickets.length} ticket(s) for "${eventTitle}" are confirmed. Order #${order.orderNumber}.`,
        link: '/user/tickets',
        email: { to: userEmail, subject, html },
      });
    }
  } catch (notifyErr) {
    logger.error('fulfillOrder: notification failed for order', order._id, notifyErr.message);
  }

  return tickets;
};

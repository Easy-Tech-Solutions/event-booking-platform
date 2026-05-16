export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  date: string;
  time: string;
  location: string;
  venue: string;
  price: number;
  isFree: boolean;
  organizer: {
    id: string;
    name: string;
    avatar: string;
    verified?: boolean;
    followers?: number;
  };
  ticketTypes: TicketType[];
  capacity: number;
  soldTickets: number;
  tags: string[];
  isPopular?: boolean;
  isFeatured?: boolean;
  coordinates?: { lat: number; lng: number };
  isVenueBased?: boolean;
  seatMap?: SeatSection[];
  recurrence?: RecurrenceRule;
  status?: "pending" | "approved" | "rejected";
  averageRating?: number;
  reviewCount?: number;
  attendees?: PublicAttendee[];
}

export interface TicketType {
  id: string;
  name: string;
  price: number;
  description: string;
  quantity: number;
  remaining: number;
  groupDiscount?: { minQty: number; discountPercent: number };
}

export interface SeatSection {
  id: string;
  name: string;
  rows: number;
  seatsPerRow: number;
  price: number;
  color: string;
  soldSeats: string[];
}

export interface Seat {
  sectionId: string;
  row: string;
  number: number;
  label: string;
}

export interface RecurrenceRule {
  frequency: "weekly" | "monthly";
  interval: number;
  endDate: string;
  occurrences?: string[];
}

export interface Booking {
  id: string;
  eventId: string;
  eventTitle: string;
  eventImage: string;
  date: string;
  venue: string;
  tickets: {
    type: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  status: "confirmed" | "pending" | "cancelled" | "refund_requested";
  bookingDate: string;
  qrCode?: string;
  seats?: Seat[];
  promoCode?: string;
  discountAmount?: number;
  transferredTo?: string;
  refundReason?: string;
  calendarSynced?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: "attendee" | "organizer" | "admin";
  followedOrganizers?: string[];
  referralCode?: string;
  browsingHistory?: string[];
  location?: string;
}

export interface Review {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
  attended: boolean;
}

export interface WaitlistEntry {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  email: string;
  ticketTypeId: string;
  quantity: number;
  joinedAt: string;
  position: number;
}

export interface PromoCode {
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  minTickets?: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  eventId?: string;
}

export interface TicketTransfer {
  id: string;
  bookingId: string;
  fromUserId: string;
  toEmail: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface RefundRequest {
  id: string;
  bookingId: string;
  userId: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  amount: number;
  createdAt: string;
}

export interface CheckInRecord {
  bookingId: string;
  userId: string;
  userName: string;
  checkedInAt: string;
  ticketType: string;
}

export interface LivePoll {
  id: string;
  eventId: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  isActive: boolean;
  createdAt: string;
}

export interface LiveQA {
  id: string;
  eventId: string;
  question: string;
  askedBy: string;
  upvotes: number;
  answered: boolean;
  answer?: string;
  createdAt: string;
}

export interface PublicAttendee {
  id: string;
  name: string;
  avatar: string;
}

export interface PayoutRecord {
  id: string;
  organizerId: string;
  organizerName: string;
  eventId: string;
  eventTitle: string;
  amount: number;
  status: "pending" | "processing" | "paid";
  requestedAt: string;
  paidAt?: string;
}

export interface FraudAlert {
  id: number;
  type: string;
  description: string;
  severity: "High" | "Medium" | "Low";
  time: string;
  userId?: string;
  eventId?: string;
  status: "open" | "investigating" | "resolved";
}

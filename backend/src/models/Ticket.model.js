import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      sparse: true,
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    ticketType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TicketType",
      required: true,
    },
    holder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    qrCode: String,
    status: {
      type: String,
      enum: ["active", "used", "cancelled", "refunded", "voided"],
      default: "active",
    },
    checkInTime: Date,
    isVip: { type: Boolean, default: false },
    isComp: { type: Boolean, default: false },
    seatId: { type: String, default: null },   // e.g. "A-3" if reserved seating
    timedEntrySlot: { type: String, default: null },
    transferHistory: [
      {
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        to: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        transferDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

ticketSchema.index({ holder: 1 });
ticketSchema.index({ event: 1 });
ticketSchema.index({ order: 1 });

ticketSchema.pre("save", function (next) {
  if (!this.ticketNumber) {
    this.ticketNumber =
      "TKT-" +
      Date.now() +
      "-" +
      Math.random().toString(36).substr(2, 9).toUpperCase();
  }
  next();
});

export default mongoose.model("Ticket", ticketSchema);

import Stripe from "stripe";
import dotenv from "dotenv";
import { Booking } from "../models/booking.model.js";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (req, res) => {
  try {
    const { amount, currency, eventTitle, bookingId, seatNumbers } = req.body;

    if (!amount || !bookingId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: currency || "inr",
            product_data: { name: eventTitle || "Event Ticket" },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
      metadata: { bookingId, seats: seatNumbers.join(","),},
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("❌ Stripe checkout session error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const bookingId = session.metadata.bookingId;
    const seats = session.metadata.seats.split(",");

    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) return console.error("Booking not found:", bookingId);

      booking.bookings.forEach((b) => {
        if (b.seats.some((s) => seats.includes(s))) {
          b.paymentStatus = "paid";
          b.paymentSessionId = session.id;
          b.amountPaid = session.amount_total / 100;
          b.currency = session.currency;
        }
      });

      booking.status = "confirmed";
      await booking.save();
      console.log(`Booking ${bookingId} marked as PAID`);
    } catch (err) {
      console.error("Error updating booking:", err.message);
    }
  }

  res.json({ received: true });
};

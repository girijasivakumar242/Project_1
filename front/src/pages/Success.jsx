import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import "../styles/Success.css";

export default function Success() {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (sessionId) {
      fetchBooking(sessionId);
      localStorage.removeItem("selectedSeats");
    }
  }, [sessionId]);

  const fetchBooking = async (id) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/v1/bookings/session/${id}`);
      setBooking(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch booking:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading ticket...</p>;
  if (!booking) return <p>Booking not found.</p>;

  // 🌐 Auto-detect host for QR code
  const currentHost = window.location.hostname;
  const port = window.location.port || 5173;
  const qrUrl = `http://${currentHost}:${port}/success?session_id=${sessionId}`;

  return (
    <div className="ticket-container">
      <div className="ticket-header">
        <h2>🎉 Payment Successful</h2>
        <p>Booking ID: {booking.bookingId}</p>
      </div>

      <div className="ticket-card">
        <p><strong>Event:</strong> {booking.eventName}</p>
        <p><strong>Venue:</strong> {booking.venueName}</p>
        <p><strong>Show Time:</strong> {booking.showTime}</p>
        <p><strong>Seats:</strong> {booking.seats.join(", ")}</p>
        <p><strong>Amount Paid:</strong> ₹{booking.amountPaid}</p>
        <p><strong>Status:</strong> {booking.status}</p>

        <div className="ticket-qr">
          <QRCodeCanvas value={qrUrl} size={180} />
          <p onClick={() => window.print()} className="download-link">Download Ticket</p>
        </div>
      </div>

      <button onClick={() => navigate("/")}>🏠 Back to Home</button>
    </div>
  );
}

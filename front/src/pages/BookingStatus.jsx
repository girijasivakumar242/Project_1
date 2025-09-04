import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../styles/BookingStatus.css";

export default function BookingStatus() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch event details
        const eventRes = await axios.get(
          `http://localhost:5000/api/v1/events/${eventId}`
        );
        setEvent(eventRes.data);

        // Fetch all bookings for this event
        const bookingRes = await axios.get(
          `http://localhost:5000/api/v1/bookings/${eventId}`
        );
        setBookings(bookingRes.data);
      } catch (err) {
        setError("Failed to fetch booking status");
        console.error(err);
      }
    }
    fetchData();
  }, [eventId]);

  if (error) return <p>{error}</p>;
  if (!event) return <p>Loading booking status...</p>;

  // Group bookings by venue + timing
  const venueStatus = event.venues
    .map((venue) => {
      return venue.timings.map((timing) => {
        const bookedSeats = bookings
          .filter(
            (b) =>
              b.venueId === venue._id &&
              b.timingId === timing._id &&
              b.status === "confirmed"
          )
          .flatMap((b) => b.seats);

        const totalSeats = venue.totalSeats || 135; // fallback
        const bookedCount = bookedSeats.length;
        const availableCount = totalSeats - bookedCount;

        return {
          venue,
          timing,
          bookedCount,
          availableCount,
        };
      });
    })
    .flat();

  return (
    <div className="booking-status-container">
      <h2 className="booking-Name">{event.eventName} – Booking Status</h2>

      {venueStatus.map((status, idx) => (
        <div key={idx} className="status-card">
          {/* Left: Venue details */}
          <div className="status-details">
            <h4>{status.venue.location}</h4>
            <p>
              {status.timing.fromTime} – {status.timing.toTime}
            </p>
          </div>

          {/* Right: Seat info */}
          <div className="seat-status">
            <div>
              <span>seats booked</span>
              <span className="booked">{status.bookedCount}</span>
            </div>
            <div>
              <span>seats Not booked</span>
              <span className="not-booked">{status.availableCount}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

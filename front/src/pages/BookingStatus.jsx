import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../styles/BookingStatus.css";

export default function BookingStatus() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // ✅ Fetch event details
        const eventRes = await axios.get(
          `http://localhost:5000/api/v1/events/${eventId}`
        );
        setEvent(eventRes.data);

        // ✅ Fetch bookings for this event
        const bookingRes = await axios.get(
          `http://localhost:5000/api/v1/bookings/${eventId}`
        );
        setBookings(bookingRes.data);

        console.log("Fetched Bookings:", bookingRes.data);
        console.log("Fetched Event:", eventRes.data);
      } catch (err) {
        console.error("Booking status fetch error:", err);
        setError("Failed to fetch booking status. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [eventId]);

  if (loading) return <p className="loading-text">Loading booking status...</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!event) return <p>No event details found.</p>;

  // ✅ Build venue-wise booking status
  const venueStatus = event.venues
    .map((venue) => {
      // Case 1: Venue has timings
      if (venue.timings && venue.timings.length > 0) {
        return venue.timings.map((timing) => {
          const bookedSeats = bookings
            .filter((b) => {
              const venueMatch =
                b.venueId?._id?.toString() === venue._id?.toString() ||
                b.venueId?.toString() === venue._id?.toString();

              const timingMatch =
                b.timingId === null ||
                b.timingId?._id?.toString() === timing._id?.toString() ||
                b.timingId?.toString() === timing._id?.toString();

              const statusMatch = b.status?.toLowerCase() === "confirmed";

              return venueMatch && timingMatch && statusMatch;
            })
            .flatMap((b) =>
              Array.isArray(b.seats) ? b.seats : b.seat ? [b.seat] : []
            );

          const bookedCount = bookedSeats.length;
          const totalSeats = timing.totalSeats || venue.totalSeats || 135;
          const availableCount = Math.max(totalSeats - bookedCount, 0);

          return {
            venue,
            timing,
            bookedCount,
            availableCount,
            totalSeats,
          };
        });
      }

      // Case 2: Venue without timings
      const bookedSeats = bookings
        .filter((b) => {
          const venueMatch =
            b.venueId?._id?.toString() === venue._id?.toString() ||
            b.venueId?.toString() === venue._id?.toString();

          const statusMatch = b.status?.toLowerCase() === "confirmed";

          return venueMatch && !b.timingId && statusMatch;
        })
        .flatMap((b) =>
          Array.isArray(b.seats) ? b.seats : b.seat ? [b.seat] : []
        );

      const bookedCount = bookedSeats.length;
      const totalSeats = venue.totalSeats || 135;
      const availableCount = Math.max(totalSeats - bookedCount, 0);

      return [
        {
          venue,
          timing: null,
          bookedCount,
          availableCount,
          totalSeats,
        },
      ];
    })
    .flat();

  return (
    <div className="booking-status-container">
      <h2 className="booking-Name">{event.eventName} – Booking Status</h2>

      {venueStatus.map((status, idx) => (
        <div key={idx} className="status-card">
          {/* ✅ Venue Info */}
          <div className="status-details">
            <h4>{status.venue.location}</h4>
            {status.timing ? (
              <p>
                {status.timing.fromTime} – {status.timing.toTime}
              </p>
            ) : (
              <p>No specific timing</p>
            )}
            <p className="total-seats">Total Seats: {status.totalSeats}</p>
          </div>

          {/* ✅ Seat Booking Info */}
          <div className="seat-status">
            <div>
              <span>Seats Booked:</span>
              <span className="booked">{status.bookedCount}</span>
            </div>
            <div>
              <span>Seats Available:</span>
              <span className="not-booked">{status.availableCount}</span>
            </div>
          </div>
        </div>
      ))}

      {venueStatus.length === 0 && (
        <p className="no-bookings">No booking data available yet.</p>
      )}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/BookingStatus.css";

export default function BookingStatus() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // per-event timers: key = event._id
  const [eventTimers, setEventTimers] = useState({});

  useEffect(() => {
    let intervals = [];

    const fetchData = async () => {
      try {
        setLoading(true);

        const [eventRes, bookingRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/v1/events/${eventId}`),
          axios.get(`http://localhost:5000/api/v1/bookings/${eventId}`),
        ]);

        const eventData = eventRes.data?.event || eventRes.data;
        setEvent(eventData);
        setBookings(bookingRes.data || []);

        // Setup per-event delete timer
        if (eventData) {
          const createdAt = new Date(eventData.createdAt);
          const now = new Date();
          let remainingMs = 600000 - (now - createdAt); // 10 mins
          const canDelete = remainingMs > 0;

          setEventTimers({
            [eventData._id]: {
              canDelete,
              fadeOut: false,
              timer: canDelete ? formatTime(remainingMs) : "Expired",
            },
          });

          if (canDelete) {
            const interval = setInterval(() => {
              remainingMs -= 1000;
              setEventTimers((prev) => ({
                ...prev,
                [eventData._id]: {
                  ...prev[eventData._id],
                  timer: remainingMs > 0 ? formatTime(remainingMs) : "Expired",
                  canDelete: remainingMs > 0,
                  fadeOut: remainingMs <= 0,
                },
              }));
              if (remainingMs <= 0) clearInterval(interval);
            }, 1000);

            intervals.push(interval);
          }
        }
      } catch (err) {
        console.error("Booking status fetch error:", err);
        setError("Failed to fetch booking status. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => intervals.forEach((i) => clearInterval(i));
  }, [eventId]);

  const formatTime = (ms) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}m ${secs < 10 ? "0" + secs : secs}s`;
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`http://localhost:5000/api/v1/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("✅ Event deleted successfully!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Error deleting event:", err);
      alert("Failed to delete event.");
    }
  };

  if (loading) return <p className="loading-text">Loading booking status...</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!event) return <p>No event details found.</p>;

  const venueStatus = event.venues
    .map((venue) => {
      if (venue.timings?.length) {
        return venue.timings.map((timing) => {
          const bookedSeats = bookings
            .filter(
              (b) =>
                (b.venueId?._id?.toString() === venue._id?.toString() ||
                  b.venueId?.toString() === venue._id?.toString()) &&
                (b.timingId === null ||
                  b.timingId?._id?.toString() === timing._id?.toString() ||
                  b.timingId?.toString() === timing._id?.toString()) &&
                b.status?.toLowerCase() === "confirmed"
            )
            .flatMap((b) => (Array.isArray(b.seats) ? b.seats : b.seat ? [b.seat] : []));
          const totalSeats = timing.totalSeats || venue.totalSeats || 135;
          return { venue, timing, bookedCount: bookedSeats.length, availableCount: Math.max(totalSeats - bookedSeats.length, 0), totalSeats };
        });
      }

      const bookedSeats = bookings
        .filter(
          (b) =>
            (b.venueId?._id?.toString() === venue._id?.toString() ||
              b.venueId?.toString() === venue._id?.toString()) &&
            !b.timingId &&
            b.status?.toLowerCase() === "confirmed"
        )
        .flatMap((b) => (Array.isArray(b.seats) ? b.seats : b.seat ? [b.seat] : []));
      const totalSeats = venue.totalSeats || 135;
      return [{ venue, timing: null, bookedCount: bookedSeats.length, availableCount: Math.max(totalSeats - bookedSeats.length, 0), totalSeats }];
    })
    .flat();

  return (
    <div className="booking-status-container">
      <h2 className="booking-Name">{event.eventName} – Booking Status</h2>

      {venueStatus.length ? (
        venueStatus.map((status, idx) => (
          <div key={idx} className="status-card">
            <div className="status-details">
              <h4>{status.venue.location}</h4>
              {status.timing ? (
                <p>{status.timing.fromTime} – {status.timing.toTime}</p>
              ) : (
                <p>No specific timing</p>
              )}
              <p className="total-seats">Total Seats: {status.totalSeats}</p>
            </div>

            <div className="seat-status">
              <div>
                <span>Seats Booked:</span>
                <span className="booked">{status.bookedCount}</span>
              </div>
              <div>
                <span>Seats Available:</span>
                <span className="not-booked">{status.availableCount}</span>
              </div>

              {/* per-event delete button */}
              {eventTimers[event._id]?.canDelete && (
                <div className={`delete-section ${eventTimers[event._id].fadeOut ? "fade-out" : ""}`}>
                  <button className="delete-btn" onClick={() => handleDelete(event._id)}>
                    Delete Event ({eventTimers[event._id].timer})
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      ) : (
        <p className="no-bookings">No booking data available yet.</p>
      )}
    </div>
  );
}

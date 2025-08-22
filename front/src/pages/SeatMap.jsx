import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../styles/SeatMap.css";

export default function SeatMap() {
  const { eventId, location } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [bookingMessage, setBookingMessage] = useState("");

  // Fetch event details
  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/v1/events/id/${eventId}`
        );
        setEvent(res.data);
      } catch (err) {
        setError("Failed to fetch event details");
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [eventId]);

  // Fetch already booked seats
  useEffect(() => {
    async function fetchBookedSeats() {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/v1/bookings/${eventId}`
        );
        // Flatten all booked seats
        const booked = res.data.flatMap((booking) => booking.seats);
        setBookedSeats(booked);
      } catch (err) {
        console.error("Failed to fetch booked seats", err);
      }
    }
    fetchBookedSeats();
  }, [eventId]);

  if (loading) return <p>Loading seat map...</p>;
  if (error) return <p>{error}</p>;
  if (!event) return <p>No event found</p>;

  const seatMapUrl = event.seatMap
    ? `http://localhost:5000${event.seatMap}`
    : null;

  // Generate seats dynamically
  const seatNumbers = Array.from({ length: 26 }, (_, i) =>
    String.fromCharCode(65 + i)
  ).flatMap((row) =>
    Array.from({ length: 20 }, (_, j) => `${row}${j + 1}`)
  );

  // Filtering
  const filteredSeats = seatNumbers.filter((seat) => {
    if (!search) return true;
    const searchUpper = search.toUpperCase();
    return seat.startsWith(searchUpper);
  });

  // Group by row
  const groupedSeats = filteredSeats.reduce((acc, seat) => {
    const row = seat.charAt(0);
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    return acc;
  }, {});

  const handleSeatSelect = (e) => {
    const seat = e.target.value;
    if (seat && !selectedSeats.includes(seat) && !bookedSeats.includes(seat)) {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const removeSeat = (seat) => {
    setSelectedSeats(selectedSeats.filter((s) => s !== seat));
  };

  const handleBooking = async () => {
    if (!selectedSeats.length) {
      alert("Please select at least one seat.");
      return;
    }

    try {
      const userId = "64f2a2e4c23a1f001a5d8bcd"; // replace with logged-in userId

      const res = await axios.post("http://localhost:5000/api/v1/bookings", {
        eventId: event._id,
        seats: selectedSeats,
        userId: userId
      });

      alert("Booking successful!");
      setBookingMessage("Booking confirmed!");
      // Refresh booked seats so they appear as unavailable for others
      setBookedSeats([...bookedSeats, ...selectedSeats]);
      setSelectedSeats([]);
    } catch (error) {
      console.error("Error booking seats", error.response?.data || error.message);
      alert(error.response?.data?.error || "Booking failed");
    }
  };

  return (
    <div className="seatmap-container">
      <h2>{event.eventName}</h2>
      <p>Location: {decodeURIComponent(location)}</p>

      <div className="seatmap-layout">
        <div className="seatmap-card">
          <h3 className="text-lg font-bold mb-2">Seat Map</h3>
          {seatMapUrl ? (
            <img src={seatMapUrl} alt={`${event.eventName} Seat Map`} className="seat-map-image" />
          ) : (
            <p>No seat map available for this event.</p>
          )}
        </div>

        <div className="seatmap-card">
          <h3 className="text-lg font-bold mb-2">Choose Your Seats</h3>
          <input
            type="text"
            placeholder="Search seat (e.g., A, B, C, A10)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select onChange={handleSeatSelect}>
            <option value="">Select a seat</option>
            {Object.keys(groupedSeats).map((row) => (
              <optgroup key={row} label={`Row ${row}`}>
                {groupedSeats[row].map((seat) => (
                  <option key={seat} value={seat} disabled={bookedSeats.includes(seat)}>
                    {seat} {bookedSeats.includes(seat) ? "(Booked)" : ""}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          {selectedSeats.length > 0 && (
            <>
              <div className="selected-seats-list">
                <h4>✅ Selected Seats:</h4>
                <ul>
                  {selectedSeats.map((seat) => (
                    <li key={seat}>
                      {seat}{" "}
                      <button className="remove-seat-btn" onClick={() => removeSeat(seat)}>
                        ✖
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <button className="book-now-btn" onClick={handleBooking}>
                Book Now
              </button>
            </>
          )}

          {bookingMessage && <p className="booking-msg">{bookingMessage}</p>}
        </div>
      </div>
    </div>
  );
}

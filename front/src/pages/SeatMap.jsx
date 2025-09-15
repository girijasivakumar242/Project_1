import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../styles/SeatMap.css";

export default function SeatMap() {
  const { eventId, location, venueDate, timingId } = useParams();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [bookingMessage, setBookingMessage] = useState("");

  // ✅ Fetch event details
  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/v1/events/${eventId}`
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

  // ✅ Merge all venues with same location & date
  const mergedVenue = event?.venues
    ?.filter(
      (v) =>
        v.location === decodeURIComponent(location) &&
        new Date(v.startDate).toLocaleDateString() ===
          decodeURIComponent(venueDate)
    )
    ?.reduce(
      (acc, v) => ({
        _id: acc._id || v._id,
        location: v.location,
        seatMap: v.seatMap || acc.seatMap,
        timings: v.timings || acc.timings,
      }),
      {}
    );

  const selectedVenue = mergedVenue;

  // ✅ Fetch booked seats
  useEffect(() => {
    async function fetchBookedSeats() {
      if (!timingId || !selectedVenue?._id) return;
      try {
        const res = await axios.get(
          `http://localhost:5000/api/v1/bookings/${eventId}/${selectedVenue._id}/${timingId}`
        );

        // Flatten out booked seats
        const booked = res.data.flatMap((booking) =>
          booking.bookings ? booking.bookings.flatMap((b) => b.seats) : []
        );
        setBookedSeats(booked);
      } catch (err) {
        console.error("Failed to fetch booked seats", err);
      }
    }
    fetchBookedSeats();
  }, [eventId, timingId, selectedVenue?._id]);

  if (loading) return <p>Loading seat map...</p>;
  if (error) return <p>{error}</p>;
  if (!event) return <p>No event found</p>;
  if (!selectedVenue) return <p>No venue found for this location.</p>;

  // ✅ Seat map image
  const seatMapUrl = selectedVenue.seatMap
    ? `http://localhost:5000${selectedVenue.seatMap}`
    : null;

  // ✅ Generate seats (A–Z, 20 seats each)
  const seatNumbers = Array.from({ length: 26 }, (_, i) =>
    String.fromCharCode(65 + i)
  ).flatMap((row) =>
    Array.from({ length: 20 }, (_, j) => `${row}${j + 1}`)
  );

  // ✅ Filter seats
  const filteredSeats = seatNumbers.filter((seat) => {
    if (!search) return true;
    const searchUpper = search.toUpperCase();
    return seat.startsWith(searchUpper);
  });

  // ✅ Group seats by row
  const groupedSeats = filteredSeats.reduce((acc, seat) => {
    const row = seat.charAt(0);
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    return acc;
  }, {});

  // ✅ Select seat
  const handleSeatSelect = (e) => {
    const seat = e.target.value;
    if (
      seat &&
      !selectedSeats.includes(seat) &&
      !bookedSeats.includes(seat)
    ) {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const removeSeat = (seat) => {
    setSelectedSeats(selectedSeats.filter((s) => s !== seat));
  };

// ✅ Booking handler
const handleBooking = async () => {
  if (!selectedSeats.length) {
    alert("Please select at least one seat.");
    return;
  }

  // get userId from localStorage (after login you should save it there)
  const loggedInUserId = localStorage.getItem("userId");

  const payload = {
    eventId: event._id,            // ✅ use event from state
    venueId: selectedVenue._id,    // ✅ use selectedVenue
    timingId: timingId || null,    // ✅ optional
    userId: loggedInUserId,        // ✅ from localStorage
    seats: selectedSeats,
  };
  console.log("📌 Booking Payload:", payload);


  try {
    const response = await fetch("http://localhost:5000/api/v1/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("📌 Booking Response:", data);

    if (response.ok) {
      setBookingMessage("✅ Booking confirmed!");
      setBookedSeats([...bookedSeats, ...selectedSeats]);
      setSelectedSeats([]);
    } else {
      alert(data.error || "Booking failed");
    }
  } catch (err) {
    console.error("Booking request failed", err);
  }
};


  return (
    <div className="seatmap-container">
      <h2>{event.eventName}</h2>
      <p>Location: {decodeURIComponent(location)}</p>
      <p>Date: {decodeURIComponent(venueDate)}</p>

      <div className="seatmap-layout">
        {/* Seat Map */}
        <div className="seatmap-card">
          <h3 className="text-lg font-bold mb-2">Seat Map</h3>
          {seatMapUrl ? (
            <img
              src={seatMapUrl}
              alt={`${event.eventName} Seat Map`}
              className="seat-map-image"
            />
          ) : (
            <p>No seat map available for this venue.</p>
          )}
        </div>

        {/* Seat Selection */}
        <div className="seatmap-card">
          <h3 className="text-lg font-bold mb-2">Choose Your Seats</h3>

          {/* Search */}
          <input
            type="text"
            placeholder="Search seat (e.g., A, B, C, A10)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Seat Dropdown */}
          <select onChange={handleSeatSelect}>
            <option value="">Select a seat</option>
            {Object.keys(groupedSeats).map((row) => (
              <optgroup key={row} label={`Row ${row}`}>
                {groupedSeats[row].map((seat) => (
                  <option
                    key={seat}
                    value={seat}
                    disabled={bookedSeats.includes(seat)}
                  >
                    {seat} {bookedSeats.includes(seat) ? "(Booked)" : ""}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          {/* Selected Seats */}
          {selectedSeats.length > 0 && (
            <>
              <div className="selected-seats-list">
                <h4>✅ Selected Seats:</h4>
                <ul>
                  {selectedSeats.map((seat) => (
                    <li key={seat}>
                      {seat}{" "}
                      <button
                        className="remove-seat-btn"
                        onClick={() => removeSeat(seat)}
                      >
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

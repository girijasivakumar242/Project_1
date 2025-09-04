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
  const [selectedTiming, setSelectedTiming] = useState("");

  // ✅ Fetch event details
  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/v1/events/${eventId}`
        );
        console.log("Event API response:", res.data);
        setEvent(res.data);
      } catch (err) {
        setError("Failed to fetch event details");
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [eventId]);

  // ✅ Merge all venues with the same location
  const mergedVenue = event?.venues
    ?.filter((v) => v.location === decodeURIComponent(location))
    ?.reduce(
      (acc, v) => ({
        ...acc,
        _id: v._id, // keep one id (needed for booking payload)
        location: v.location,
        seatMap: v.seatMap || acc.seatMap,
        timings: [...(acc.timings || []), ...v.timings],
      }),
      {}
    );

  const selectedVenue = mergedVenue;

  // ✅ Fetch booked seats whenever timing or venue changes
  useEffect(() => {
    async function fetchBookedSeats() {
      if (!selectedTiming || !selectedVenue?._id) return;
      try {
        const res = await axios.get(
          `http://localhost:5000/api/v1/bookings/${eventId}/${selectedVenue._id}/${selectedTiming}`
        );
        const booked = res.data.flatMap((booking) => booking.seats);
        setBookedSeats(booked);
      } catch (err) {
        console.error("Failed to fetch booked seats", err);
      }
    }
    fetchBookedSeats();
  }, [eventId, selectedTiming, selectedVenue?._id]);

  if (loading) return <p>Loading seat map...</p>;
  if (error) return <p>{error}</p>;
  if (!event) return <p>No event found</p>;
  if (!selectedVenue) return <p>No venue found for this location.</p>;

  // ✅ Seat map image
  const seatMapUrl = selectedVenue.seatMap
    ? `http://localhost:5000${selectedVenue.seatMap}`
    : null;

  // ✅ Generate seats (rows A–Z, 20 seats each)
  const seatNumbers = Array.from({ length: 26 }, (_, i) =>
    String.fromCharCode(65 + i)
  ).flatMap((row) =>
    Array.from({ length: 20 }, (_, j) => `${row}${j + 1}`)
  );

  // ✅ Filter seats by search
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

  // ✅ Booking
  const handleBooking = async () => {
    if (!selectedSeats.length) {
      alert("Please select at least one seat.");
      return;
    }
    if (!selectedTiming) {
      alert("Please select a timing.");
      return;
    }

    try {
      const payload = {
        eventId: event._id,
        venueId: selectedVenue._id,
        timingId: selectedTiming,
        userId: "64f2a2e4c23a1f001a5d8bcd", // 🔑 replace with logged-in user
        seats: selectedSeats,
      };

      console.log("Sending booking payload:", payload);

      const response = await fetch("http://localhost:5000/api/v1/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        console.log("Booking successful:", data);
        setBookingMessage("✅ Booking confirmed!");
        setBookedSeats([...bookedSeats, ...selectedSeats]);
        setSelectedSeats([]);
      } else {
        console.error("Error booking seats", data);
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

          {/* ✅ Timing selection */}
          {selectedVenue.timings?.length > 0 && (
            <div className="mb-3">
              <label className="block mb-1">Select Timing:</label>
              <select
                value={selectedTiming}
                onChange={(e) => setSelectedTiming(e.target.value)}
              >
                <option value="">-- Choose a timing --</option>
                {selectedVenue.timings.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.fromTime} - {t.toTime}
                  </option>
                ))}
              </select>
            </div>
          )}

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

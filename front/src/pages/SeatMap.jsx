import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import "../styles/SeatMap.css";
import "../styles/PaymentPopup.css";

export default function SeatMap() {
  const { eventId, location, venueDate, timingId, ticketPrice } = useParams();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [stripe, setStripe] = useState(null);
  const [stripeReady, setStripeReady] = useState(false); // ✅ Track Stripe readiness

  // Fetch event details
  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await axios.get(`http://localhost:5000/api/v1/events/${eventId}`);
        setEvent(res.data);
      } catch (err) {
        setError("Failed to fetch event details");
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [eventId]);

  // Merge venue timings
  const mergedVenue = event?.venues
    ?.filter(
      (v) =>
        v.location === decodeURIComponent(location) &&
        new Date(v.startDate).toLocaleDateString() === decodeURIComponent(venueDate)
    )
    ?.reduce((acc, v) => {
      const timings = [...(acc.timings || [])];
      if (v.timings && Array.isArray(v.timings)) {
        timings.push(...v.timings);
      } else if (v.fromTime || v.toTime) {
        timings.push({
          _id: v._id,
          fromTime: v.fromTime,
          toTime: v.toTime,
          seatMap: v.seatMap,
          totalSeats: v.totalSeats,
          ticketPrice: v.ticketPrice,
        });
      }
      return {
        ...acc,
        _id: acc._id || v._id,
        location: v.location,
        seatMap: v.seatMap || acc.seatMap,
        timings,
      };
    }, {});

  const selectedVenue = mergedVenue;

  // Fetch booked seats
  useEffect(() => {
    async function fetchBookedSeats() {
      if (!timingId || !selectedVenue?._id) return;
      try {
        const res = await axios.get(
          `http://localhost:5000/api/v1/bookings/${eventId}/${selectedVenue._id}/${timingId}`
        );
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

  // Fetch Stripe publishable key from backend
  useEffect(() => {
    async function fetchStripeKey() {
      try {
        const res = await axios.get("http://localhost:5000/api/payments/stripe-key");
        if (res.data.publishableKey) {
          const stripeInstance = await loadStripe(res.data.publishableKey);
          setStripe(stripeInstance);
          setStripeReady(true); // ✅ Stripe is now ready
        } else {
          console.error("Stripe publishable key not received from backend");
        }
      } catch (err) {
        console.error("Failed to fetch Stripe key", err);
      }
    }
    fetchStripeKey();
  }, []);

  if (loading) return <p>Loading seat map...</p>;
  if (error) return <p>{error}</p>;
  if (!event) return <p>No event found</p>;
  if (!selectedVenue) return <p>No venue found for this location.</p>;

  const seatMapUrl = selectedVenue.seatMap ? `http://localhost:5000${selectedVenue.seatMap}` : null;
  const selectedTiming = selectedVenue.timings?.find((t) => t._id === timingId);
  const effectiveTicketPrice = parseFloat(ticketPrice) || selectedTiming?.ticketPrice || 0;

  // Generate seat numbers
  const seatNumbers = Array.from({ length: 26 }, (_, i) =>
    String.fromCharCode(65 + i)
  ).flatMap((row) =>
    Array.from({ length: 20 }, (_, j) => `${row}${j + 1}`)
  );

  const filteredSeats = seatNumbers.filter((seat) => {
    if (!search) return true;
    const searchUpper = search.toUpperCase();
    return seat.startsWith(searchUpper);
  });

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

  const handleBooking = () => {
    if (!selectedSeats.length) {
      alert("Please select at least one seat.");
      return;
    }
    setShowPopup(true);
  };

const handleProceedPayment = async () => {
  try {
    const sGst = 15;
    const intermediate = 15;
    const total = effectiveTicketPrice * selectedSeats.length + sGst + intermediate;

    const response = await axios.post(
      "http://localhost:5000/api/payments/create-checkout-session",
      { totalAmount: total }
    );

    const { url } = response.data;

    if (url) {
      // ✅ redirect directly
      window.location.href = url;
    } else {
      alert("Failed to create payment session.");
    }
  } catch (err) {
    console.error("Payment initiation failed:", err);
    alert("Failed to start payment process.");
  }
};


  const sGst = 15;
  const intermediate = 15;
  const total = effectiveTicketPrice * selectedSeats.length + sGst + intermediate;

  return (
    <div className="seatmap-container">
      <h2>{event.eventName}</h2>
      <p>Location: {decodeURIComponent(location)}</p>
      <p>Date: {decodeURIComponent(venueDate)}</p>
      {selectedTiming && (
        <p>
          Timing: <strong>{selectedTiming.fromTime} - {selectedTiming.toTime}</strong>
        </p>
      )}
      <p>💰 Ticket Price: ₹{effectiveTicketPrice}</p>

      <div className="seatmap-layout">
        <div className="seatmap-card">
          <h3 className="text-lg font-bold mb-2">Seat Map</h3>
          {seatMapUrl ? (
            <img src={seatMapUrl} alt={`${event.eventName} Seat Map`} className="seat-map-image" />
          ) : (
            <p>No seat map available for this venue.</p>
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
        </div>
      </div>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-container">
            <button className="close-btn" onClick={() => setShowPopup(false)}>✖</button>
            <h2>{event.eventName}</h2>
            <p>
              <strong>{decodeURIComponent(location)}</strong>{" "}
              <span className="time">{selectedTiming?.fromTime}</span>
            </p>

            <div className="price-details">
              <p><strong>Ticket Price</strong> : ₹{effectiveTicketPrice} x {selectedSeats.length}</p>
              <p><strong>sGst & cGst</strong> : ₹{sGst}</p>
              <p><strong>intermediate cost</strong> : ₹{intermediate}</p>
              <hr />
              <p className="total"><strong>Total Price :</strong> ₹{total}</p>
            </div>

            <button
              className="proceed-btn"
              onClick={handleProceedPayment}
              disabled={!stripeReady} // ✅ disable until Stripe is ready
            >
              {stripeReady ? "Proceed to Pay" : "Loading Payment..."}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

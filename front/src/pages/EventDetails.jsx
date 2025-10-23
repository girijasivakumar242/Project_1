import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/EventDetails.css";

// Helper: calculate duration between two times
function calculateDuration(fromTime, toTime) {
  if (!fromTime || !toTime) return "";
  const [fh, fm] = fromTime.split(":").map(Number);
  const [th, tm] = toTime.split(":").map(Number);

  let from = new Date();
  let to = new Date();
  from.setHours(fh, fm, 0);
  to.setHours(th, tm, 0);

  if (to < from) to.setDate(to.getDate() + 1);

  const diff = (to - from) / 60000; // minutes
  const hrs = Math.floor(diff / 60);
  const mins = diff % 60;

  return `${hrs > 0 ? hrs + "h " : ""}${mins > 0 ? mins + "m" : ""}`.trim();
}

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/v1/events/${id}`);
        setEvent(res.data);
      } catch (err) {
        console.error("Error fetching event:", err);
      }
    };
    fetchEvent();
  }, [id]);

  if (!event) return <p className="loading">Loading...</p>;

  // Group venues by date & location, merge timings
  const venuesByDate = {};
  event.venues?.forEach((venue) => {
    const date = venue.startDate
      ? new Date(venue.startDate).toLocaleDateString()
      : "No Date";

    if (!venuesByDate[date]) venuesByDate[date] = {};

    if (!venuesByDate[date][venue.location]) {
      venuesByDate[date][venue.location] = {
        location: venue.location,
        startDate: venue.startDate,
        endDate: venue.endDate,
        timings: [],
      };
    }

    // Case 1: timing directly on venue
    if (venue.fromTime && venue.toTime) {
      venuesByDate[date][venue.location].timings.push({
        _id: venue._id, // assign unique id
        fromTime: venue.fromTime,
        toTime: venue.toTime,
        seatMap: venue.seatMap,
        totalSeats: venue.totalSeats,
        ticketPrice: venue.ticketPrice,
      });
    }

    // Case 2: multiple timings inside array
    if (venue.timings && Array.isArray(venue.timings)) {
      venue.timings.forEach((t) => {
        venuesByDate[date][venue.location].timings.push({
          _id: t._id, 
          fromTime: t.fromTime,
          toTime: t.toTime,
          seatMap: t.seatMap || venue.seatMap,
          totalSeats: t.totalSeats || venue.totalSeats,
          ticketPrice: t.ticketPrice || venue.ticketPrice,
        });
      });
    }
  });

  return (
    <main className="main-content">
      <div className="event-details-page">
        {/* Event Header */}
        <div className="event-header">
          <div className="event-info">
            <h1>{event.eventName}</h1>
            <p className="event-category">📌 {event.category}</p>
          </div>
          {event.poster && (
            <img
              src={`http://localhost:5000${event.poster}`}
              alt={event.eventName}
              className="event-posters"
              onError={(e) => (e.target.src = "/placeholder.png")}
            />
          )}
        </div>

        {/* Venue Listings */}
        <div className="venues-section">
          {Object.keys(venuesByDate).map((date, idx) => (
            <div key={idx} className="date-section">
              <h2 className="date-heading">{date}</h2>

              {Object.values(venuesByDate[date]).map((venue, vIdx) => (
                <div key={vIdx} className="venue-card">
                  <div className="venue-header">
                    <p className="venue-name">🎭 {venue.location}</p>
                    <p className="venue-dates">
                      📅 {venue.startDate
                        ? new Date(venue.startDate).toLocaleDateString()
                        : "—"}{" "}
                      →{" "}
                      {venue.endDate
                        ? new Date(venue.endDate).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>

                  {/* Timings List */}
                  <div className="showtimes">
                    {venue.timings.length > 0 ? (
                      venue.timings.map((t, tIdx) => (
                        <div key={tIdx} className="timing-item">
                          <button
                            className="showtime-btn"
                            onClick={() =>
                              navigate(
                                `/seatmap/${event._id}/${encodeURIComponent(
                                  venue.location
                                )}/${encodeURIComponent(date)}/${t._id}/${t.ticketPrice}`
                              )
                            }
                          >
                            {t.fromTime || "Not specified"} – {t.toTime || "Not specified"}
                          </button>
                          <span className="duration">
                            ⏱ {calculateDuration(t.fromTime, t.toTime)}
                          </span>
                          {t.totalSeats && (
                            <span className="seats">🎟 {t.totalSeats} seats</span>
                          )}
                          <p className="ticket-price">💰 ₹{t.ticketPrice}</p>
                        </div>
                      ))
                    ) : (
                      <p className="no-timings">No showtimes available</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

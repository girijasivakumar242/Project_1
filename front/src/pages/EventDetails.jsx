import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // ✅ added useNavigate
import axios from "axios";
import "../styles/EventDetails.css";

function calculateDuration(fromTime, toTime) {
  if (!fromTime || !toTime) return "";
  const [fh, fm] = fromTime.split(":").map(Number);
  const [th, tm] = toTime.split(":").map(Number);
  let from = new Date();
  let to = new Date();
  from.setHours(fh, fm, 0);
  to.setHours(th, tm, 0);
  if (to < from) to.setDate(to.getDate() + 1);
  const diff = (to - from) / 60000;
  const hrs = Math.floor(diff / 60);
  const mins = diff % 60;
  return `${hrs > 0 ? hrs + "h " : ""}${mins > 0 ? mins + "m" : ""}`.trim();
}

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate(); // ✅ initialize useNavigate
  const [event, setEvent] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/v1/events/id/${id}`
        );
        setEvent(res.data);
      } catch (err) {
        console.error("❌ Error fetching event:", err);
      }
    };
    fetchEvent();
  }, [id]);

  if (!event) return <p className="loading">Loading...</p>;

  // ✅ Group venues by date & location
  const venuesByDate = {};
  event.venues?.forEach((venue) => {
    const date = new Date(venue.startDate).toLocaleDateString();
    if (!venuesByDate[date]) venuesByDate[date] = {};

    if (!venuesByDate[date][venue.location]) {
      venuesByDate[date][venue.location] = {
        location: venue.location,
        startDate: venue.startDate,
        endDate: venue.endDate,
        ticketPrice: venue.ticketPrice,
        timings: [],
      };
    }

    venuesByDate[date][venue.location].timings.push({
      fromTime: venue.fromTime,
      toTime: venue.toTime,
    });
  });

  return (
    <div className="event-details-page">
      {/* Header */}
      <div className="event-header">
        <div className="event-info">
          <h1>{event.eventName}</h1>
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

      {/* Venue listings grouped by date */}
      <div className="venues-section">
        {Object.keys(venuesByDate).map((date, idx) => (
          <div key={idx}>
            <h2 className="date-heading">{date}</h2>

            {Object.values(venuesByDate[date]).map((venue, vIdx) => (
              <div key={vIdx} className="venue-card">
                <div className="venue-header">
                  <p className="venue-name">🎭 {venue.location}</p>
                  <p className="venue-dates">
                    {new Date(venue.startDate).toLocaleDateString()} –{" "}
                    {new Date(venue.endDate).toLocaleDateString()}
                  </p>
                </div>

                {/* Timings */}
                <div className="showtimes">
                  {venue.timings.map((t, tIdx) => (
                    <div key={tIdx} className="timing-item">
                      <button className="showtime-btn">
                        {t.fromTime} – {t.toTime}
                      </button>
                      <span className="duration">
                        ⏱ {calculateDuration(t.fromTime, t.toTime)}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="ticket-price">🎟 Ticket: ₹{venue.ticketPrice}</p>

                <div className="book-now-container">
                  <button
                    className="book-btn"
                    onClick={() =>
                      navigate(
                        `/seatmap/${event._id}/${encodeURIComponent(
                          venue.location
                        )}`
                      )
                    }
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

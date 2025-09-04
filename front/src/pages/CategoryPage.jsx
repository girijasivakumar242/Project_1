import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/CategoryPage.css";

export default function CategoryPage() {
  const { category } = useParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `http://localhost:5000/api/v1/events/category/${category.toLowerCase()}`
        );
        setEvents(res.data);
      } catch (err) {
        console.error("❌ Error fetching events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [category]);

  const handleEventClick = (id) => {
    navigate(`/event/${id}`);
  };

  return (
    <div className="category-page">
      <h2 className="category-title">{category.charAt(0).toUpperCase() + category.slice(1)}</h2>

      {loading ? (
        <p>Loading events...</p>
      ) : events.length === 0 ? (
        <p>No events found for "{category}"</p>
      ) : (
        <div>
          {events.map((event) => (
            <div
              key={event._id}
              className="event-cardy"
              onClick={() => handleEventClick(event._id)}
            >
              {event.poster ? (
                <img
                  src={`http://localhost:5000${event.poster}`}
                  alt={event.eventName}
                  className="event-poster"
                  onError={(e) => (e.target.src = "/placeholder.png")}
                />
              ) : (
                <div className="poster-placeholder">No Poster</div>
              )}
              <div className="event-info">
                <h3>{event.eventName}</h3>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

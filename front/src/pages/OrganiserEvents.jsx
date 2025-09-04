import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function OrganiserEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/v1/events");
        setEvents(res.data);
      } catch (err) {
        console.error("Error fetching events", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) return <p>Loading events...</p>;

  return (
    <div className="organiser-dashboard">
      <h2>Your Event</h2>

      {events.length === 0 ? (
        <p>No events yet. Create one!</p>
      ) : (
        events.map((event) => (
          <div key={event._id} className="event-card">
            <h3>{event.eventName}</h3>
            <p>{event.category}</p>
            <button onClick={() => navigate(`/events/${event._id}`)}>
              View booking Status
            </button>
          </div>
        ))
      )}

      <div className="create-new">
        <button onClick={() => navigate("/create-event")}>+ Create Event</button>
      </div>
    </div>
  );
}
   
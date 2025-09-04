import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/AudienceDashboard.css";
import logo from "../assets/bookd-logo.png";
import { Link, useNavigate } from "react-router-dom";

export default function AudienceDashboard() {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/v1/events")
      .then((res) => setEvents(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handleEventClick = (id) => {
    navigate(`/event/${id}`);
  };

  return (
    <div className="audience-dashboard">
      <nav className="navbarss">
        <img src={logo} alt="Bookd Logo" className="logo-img" />
        <input
          type="text"
          placeholder="Search for events"
          className="search-bars"
        />
        <div className="nav-links">
          <Link to="/category/movies">Movies</Link>
          <Link to="/category/concerts">Concerts</Link>
          <Link to="/category/sports">Sports</Link>
        </div>
      </nav>

      {/* Event Cards */}
      <h2 className="section-title">Trending Now</h2>
      <div className="events-container">
        {events.map((event) => (
          <div
            key={event._id}
            className="event-cards"
            onClick={() => handleEventClick(event._id)}
          >
            <img
              src={`http://localhost:5000${event.poster}`}
              alt={event.eventName}
            />
            <h3>{event.eventName}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

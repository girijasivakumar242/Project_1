import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/AudienceDashboard.css";
import logo from "../assets/bookd-logo.png"; // Import your logo image

export default function AudienceDashboard() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/v1/events")
      .then((res) => setEvents(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="audience-dashboard">
      {/* Navbar */}
      <nav className="navbarss">
        <img src={logo} alt="Bookd Logo" className="logo-img" /> {/* Logo image */}
        <input
          type="text"
          placeholder="Search for events"
          className="search-bars"
        />
        <div className="nav-links">
          <a href="#">Movies</a>
          <a href="#">Concerts</a>
          <a href="#">Sports</a>
        </div>
      </nav>

      {/* Event Cards */}
      <h2 className="section-title">Trending Now</h2>
      <div className="events-container">
        {events.map((event) => (
          <div key={event._id} className="event-cards">
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

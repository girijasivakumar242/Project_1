import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/bookd-logo.png";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("accessToken");

        const res = await axios.get(
          `http://localhost:5000/api/v1/events/organiser/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setEvents(res.data.data || []);
      } catch (err) {
        console.error("Error fetching organiser events:", err);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <img src={logo} alt="Bookd Logo" className="bookd" />
        <nav>
          <a href="/explore">Explore events</a>
          <a href="/about">About us</a>
        </nav>
        <div className="header-right">
          <div className="greeting">Greetings!!</div>
          <button className="home-btn" onClick={() => navigate("/")}>
            🏠
          </button>
        </div>
      </header>

      <section className="events-section">
        <h3>Your Events</h3>
        <div className="event-list">
          {events.length > 0 ? (
            events.map((event) => (
              <div key={event._id} className="event-cardi">
                <div>
                  <h4>{event.eventName}</h4>
                  <p>{event.category}</p>
                </div>
                <button
                  onClick={() => navigate(`/booking-status/${event._id}`)}
                  className="status-btn"
                >
                  View booking status
                </button>
              </div>
            ))
          ) : (
            <p>No events created yet.</p>
          )}
        </div>
      </section>

      <section className="create-event-promo">
        <h2>Transform Your Event in a Snap!</h2>
        <p>Kickstart your event in just 2 minutes</p>
        <button
          className="create-btn"
          onClick={() => navigate("/create-event-form")}
        >
          CREATE EVENT
        </button>
      </section>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/bookd-logo.png";
import "../styles/CreateEventLanding.css";

export default function EventLaunchPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  return (
    <div className="event-launch-container">
      {/* Top Navigation */}
      <header className="event-launch-header">
        <div className="event-launch-logo-wrap">
          <img src={logo} alt="BOOKD Logo" className="event-launch-logo" />
          <nav className="event-launch-nav">
            <a href="#">Explore events</a>
            <a href="#">About us</a>
          </nav>
        </div>

        <div className="event-launch-user-info">
          <span>Greetings!!</span>
          <strong>{username || "Guest"}</strong>
          <button
            className="event-launch-home-btn"
            onClick={() => navigate("/")}
          >
            🏠
          </button>
        </div>
      </header>

      {/* Center Content */}
      <main className="event-launch-main">
        <h2>Transform Your Event in a Snap!</h2>
        <p>Kickstart your event in just 2 minutes</p>
        <button
          className="event-launch-btn"
          onClick={() => navigate("/create-event-form")}
        >
          CREATE EVENT
        </button>
      </main>
    </div>
  );
}

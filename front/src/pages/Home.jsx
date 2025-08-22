import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HomePage.css";
import logo from "../assets/bookd-logo.png";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-left">
          <img src={logo} alt="BOOKD Logo" className="nav-logo" />
          <ul className="nav-links">
            <li>About</li>
            <li>Contact Us</li>
            <li>Pricing</li>
          </ul>
        </div>

        <div className="nav-right">
          <button
            className="get-started-btn"
            onClick={() => navigate("/signin")}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero-section">
        <h1>
          Event Management, <span className="highlight">Simplified</span>
        </h1>
        <p>
          BOOKD’s all-in-one event management platform makes planning easier
          and elevates the attendee experience.
        </p>
        <button
          className="hero-btn"
          onClick={() => navigate("/signin")}
        >
          Get Started
        </button>
      </div>
    </div>
  );
}

import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HomePage.css";
import logo from "../assets/bookd-logo.png";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* Top Navbar */}
      <nav className="navbar">
        <div className="nav-left">
          <img src={logo} alt="BOOKD Logo" className="nav-logo" />
          <input
            type="text"
            placeholder="Search for events"
            className="search-bar"
          />
          <ul className="nav-links">
            <li>Movies</li>
            <li>Concerts</li>
            <li>Sports</li>
          </ul>
        </div>
        <div className="nav-right">
          <button
            className="sign-in-btn"
            onClick={() => navigate("/signin")}
          >
            Sign In
          </button>

          {/* Hamburger Menu */}
          <div className="hamburger">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </nav>

      {/* Center Content */}
      <div className="center-content">
        <button
          className="book-now-btn"
          onClick={() => alert("Book Now clicked")}
        >
          Book Now
        </button>
      </div>
    </div>
  );
}

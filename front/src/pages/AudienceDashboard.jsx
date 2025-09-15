import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaUser,
  FaBell,
  FaHeart,
  FaMapMarkerAlt,
  FaTags,
  FaHistory,
  FaCrown,
  FaCog,
  FaGift,
  FaFire,
} from "react-icons/fa";
import "../styles/AudienceDashboard.css";
import logo from "../assets/bookd-logo.png";

export default function AudienceDashboard() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState(""); // ✅ store user’s name
  const navigate = useNavigate();

  // ✅ Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/v1/events");
        setEvents(res.data);
        setFilteredEvents(res.data);
      } catch (err) {
        setError("Failed to load events. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // ✅ Handle search filter
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(
        events.filter((event) =>
          event.eventName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, events]);

  useEffect(() => {
  const loggedInEmail = localStorage.getItem("loggedInUserEmail");
  if (loggedInEmail) {
    const storedName = localStorage.getItem(`userName_${loggedInEmail}`);
    setUserName(storedName || "");
  }
}, []);


  const handleEventClick = (id) => {
    navigate(`/event/${id}`);
    setSidebarOpen(false);
  };

  // ✅ Sidebar Options
  const sidebarOptions = [
    { icon: <FaUser />, label: "Profile", route: "/profile" },
    { icon: <FaBell />, label: "Remainder", route: "/remainder" },
    { icon: <FaHeart />, label: "Wishlist", route: "/wishlist" },
    { icon: <FaMapMarkerAlt />, label: "Location", route: "/location" },
    { icon: <FaTags />, label: "Coupons & Discounts", route: "/coupons" },
    { icon: <FaFire />, label: "Streaks", route: "/streaks" },
    { icon: <FaHistory />, label: "History", route: "/history" },
    { icon: <FaCrown />, label: "Premium", route: "/premium" },
    { icon: <FaCog />, label: "Preferences", route: "/preferences" },
    { icon: <FaGift />, label: "Rewards", route: "/rewards" },
  ];

  const handleSidebarClick = (route) => {
    navigate(route);
    setSidebarOpen(false);
  };

  return (
    <div className="audience-dashboard">
      {/* ✅ Navbar */}
      <nav className="navbarss">
        <div className="left-nav">
          <img src={logo} alt="Bookd Logo" className="logo-img" />
        </div>

        <input
          type="text"
          placeholder="Search for events"
          className="search-bars"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="nav-linkies">
          <Link to="/category/movies">Movies</Link>
          <Link to="/category/concerts">Concerts</Link>
          <Link to="/category/sports">Sports</Link>

          {/* ✅ Greeting inside navbar */}
          {userName ? (
            <span className="navbar-greeting">Welcome {userName}</span>
          ) : (
            <span className="navbar-greeting">Welcome!</span>
          )}

          

          {/* Hamburger + Home */}
          <button
            className="hamburger-btn"
            aria-label="Toggle sidebar"
            onClick={() => setSidebarOpen(true)}
          >
            <FaBars size={24} />
          </button>
          <button
            className="event-launch-home-btn"
            onClick={() => navigate("/")}
          >
            🏠
          </button>
        </div>
      </nav>

      {/* ✅ Overlay */}
      {sidebarOpen && (
        <div className="overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* ✅ Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <h3>Options</h3>
        <ul>
          {sidebarOptions.map((option, index) => (
            <li key={index} onClick={() => handleSidebarClick(option.route)}>
              <span className="sidebar-icon">{option.icon}</span>
              {option.label}
            </li>
          ))}
        </ul>
      </aside>

      {/* ✅ Event Cards */}
      <h2 className="section-title">Trending Now</h2>

      {loading ? (
        <p className="loading-text">Loading events...</p>
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : filteredEvents.length === 0 ? (
        <p className="no-events-text">No events found.</p>
      ) : (
        <div className="events-container">
          {filteredEvents.map((event) => (
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
      )}
    </div>
  );
}

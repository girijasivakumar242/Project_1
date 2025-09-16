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
  const [wishlist, setWishlist] = useState([]); // ✅ store wishlist eventIds
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  const loggedInEmail = localStorage.getItem("loggedInUserEmail");
  const token = localStorage.getItem("accessToken"); // ✅ JWT token

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

  // ✅ Fetch user wishlist
 useEffect(() => {
  if (loggedInEmail && token) {
    axios
      .get(`http://localhost:5000/api/v1/wishlist/${loggedInEmail}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setWishlist(res.data.map((event) => event._id));
      })
      .catch((err) => console.error(err));
  }
}, [loggedInEmail, token]);   // ✅ always fixed length


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

  // ✅ Fetch username from localStorage
  useEffect(() => {
    if (loggedInEmail) {
      const storedName = localStorage.getItem(`userName_${loggedInEmail}`);
      setUserName(storedName || "");
    }
  }, [loggedInEmail]);

  const handleEventClick = (id) => {
    navigate(`/event/${id}`);
    setSidebarOpen(false);
  };

  // ✅ Toggle wishlist
  const handleWishlist = async (eventId) => {
    if (!loggedInEmail || !token) {
      alert("Please login to add to wishlist.");
      return;
    }
    try {
      if (wishlist.includes(eventId)) {
        // Remove
        await axios.post(
          "http://localhost:5000/api/v1/wishlist/remove",
          { userEmail: loggedInEmail, eventId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setWishlist(wishlist.filter((id) => id !== eventId));
      } else {
        // Add
        await axios.post(
          "http://localhost:5000/api/v1/wishlist/add",
          { userEmail: loggedInEmail, eventId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setWishlist([...wishlist, eventId]);
      }
    } catch (err) {
      console.error(err);
    }
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

          {userName ? (
            <span className="navbar-greeting">Welcome {userName}</span>
          ) : (
            <span className="navbar-greeting">Welcome!</span>
          )}

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

      {sidebarOpen && (
        <div className="overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

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
            <div key={event._id} className="event-cards">
              <div className="event-poster-wrapper">
                <img
                  src={`http://localhost:5000${event.poster}`}
                  alt={event.eventName}
                  onClick={() => handleEventClick(event._id)}
                />
                <div className="event-info">
  <h3>{event.eventName}</h3>
  <FaHeart
    className={`wishlist-icon ${wishlist.includes(event._id) ? "active" : ""}`}
    onClick={(e) => {
      e.stopPropagation();  // prevent parent click
      handleWishlist(event._id);
    }}
  />
</div>
              </div>
              <h3>{event.eventName}</h3>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

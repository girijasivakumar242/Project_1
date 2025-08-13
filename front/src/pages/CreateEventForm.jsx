import React, { useState, useEffect, useRef } from "react";
import "../styles/CreateEventForm.css";
import { FaMapMarkerAlt } from "react-icons/fa";
import axios from "axios";
import logo from "../assets/bookd-logo.png";
import { useNavigate } from "react-router-dom";

export default function CreateEventForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    category: "",
    fromTime: "",
    toTime: "",
    eventName: "",
    startDate: "",
    endDate: "",
    location: "",
    ticketPrice: "",
    poster: null,
  });

  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const locationRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));

    if (name === "location") {
      if (value.trim().length > 0) {
        fetchLocationSuggestions(value);
        setShowSuggestions(true);
      } else {
        setLocationSuggestions([]);
        setShowSuggestions(false);
      }
    }
  };

  const fetchLocationSuggestions = async (query) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/districts?query=${encodeURIComponent(query)}`
      );
      setLocationSuggestions(response.data || []);
    } catch (error) {
      console.error("Error fetching districts:", error);
      setLocationSuggestions([]);
    }
  };

  const selectSuggestion = (location) => {
    setFormData((prev) => ({ ...prev, location }));
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "poster" && formData.poster) {
          data.append(key, formData.poster);
        } else if (key !== "poster") {
          data.append(key, formData[key]);
        }
      });

      await axios.post("http://localhost:5000/api/v1/events", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage("Event Created Successfully!");
      setMessageType("success");

      setFormData({
        category: "",
        fromTime: "",
        toTime: "",
        eventName: "",
        startDate: "",
        endDate: "",
        location: "",
        ticketPrice: "",
        poster: null,
      });
      setLocationSuggestions([]);
      setShowSuggestions(false);
    } catch (error) {
      console.error(error);
      setMessage("Error creating event. Please try again.");
      setMessageType("error");
    }

    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  };

  return (
    <div className="create-event-container">
      <div className="event-card">
        <div className="header-bar">
          <img src={logo} alt="Bookd Logo" className="bookd" />
          <button className="home-btn" onClick={() => navigate("/")}>
            🏠
          </button>
        </div>

        <div className="header-row">
         <span 
  className="back-arrow" 
  onClick={() => navigate("/create-event-landing")}
  style={{ cursor: "pointer" }}
>
  ←
</span>
          <h2>ORGANISE THE EVENT</h2>
        </div>

        <form onSubmit={handleSubmit} className="event-details-form">
          <h3>Event details</h3>

          <div className="form-grid">
            <label>
              Event category
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Select category</option>
                <option value="Movie">Movie</option>
                <option value="Sport">Sport</option>
                <option value="Concert">Concert</option>
              </select>
            </label>

            <label className="icon-input">
              From Time
              <input
                type="time"
                name="fromTime"
                value={formData.fromTime}
                onChange={handleChange}
              />
            </label>

            <label>
              Event Name
              <input
                type="text"
                name="eventName"
                value={formData.eventName}
                onChange={handleChange}
              />
            </label>

            <label className="icon-input">
              To Time
              <input
                type="time"
                name="toTime"
                value={formData.toTime}
                onChange={handleChange}
              />
            </label>

            <label className="icon-input">
              Start date
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
              />
            </label>

            <label className="icon-input">
              End date
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
              />
            </label>

            <label className="icon-input" ref={locationRef}>
  Location
  <div className="location-input-wrapper">
    <input
      type="text"
      name="location"
      value={formData.location}
      onChange={handleChange}
      autoComplete="off"
      onFocus={() => {
        if (formData.location.trim().length > 0) {
          fetchLocationSuggestions(formData.location);
          setShowSuggestions(true);
        }
      }}
    />
    <FaMapMarkerAlt
      className="location-icon"
      onClick={() => {
        fetchLocationSuggestions(formData.location || "");
        setShowSuggestions(true);
        locationRef.current.querySelector("input").focus();
      }}
    />

    {showSuggestions && locationSuggestions.length > 0 && (
      <div className="suggestions-container">
        {locationSuggestions.map((loc, index) => (
          <div
            key={index}
            className="suggestion-item"
            onClick={() => selectSuggestion(loc)}
            onMouseDown={(e) => e.preventDefault()}
          >
            <FaMapMarkerAlt className="suggestion-icon" />
            <div className="suggestion-text">
              <strong>{loc}</strong>
              <span className="suggestion-subtext">Tamil Nadu</span>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</label>


            <label>
              Ticket Price
              <input
                type="number"
                name="ticketPrice"
                value={formData.ticketPrice}
                onChange={handleChange}
              />
            </label>

            <label className="icon-input file-upload">
              Poster
              <input
                type="file"
                name="poster"
                accept="image/*"
                onChange={handleChange}
              />
            </label>
          </div>

          <button type="submit" className="organize-btn">
            ORGANIZE
          </button>

          {message && (
            <div
              className={`message-box ${
                messageType === "success" ? "message-success" : "message-error"
              }`}
            >
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

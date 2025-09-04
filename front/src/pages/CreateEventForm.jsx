import React, { useState } from "react";
import "../styles/CreateEventForm.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/bookd-logo.png";

export default function CreateEventForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    category: "",
    eventName: "",
    poster: null,
    seatMap: null,
  });

  const [venue, setVenue] = useState({
    location: "",
    startDate: "",
    endDate: "",
    ticketPrice: "",
    timings: [{ fromTime: "", toTime: "", totalSeats: "" }],
  });

  const chennaiLocations = {
    movies: [
      "Sathyam Cinemas",
      "Escape Cinemas",
      "PVR Skywalk",
      "AGS Cinemas",
      "Rohini Silver Screens",
      "Devi Theatre",
    ],
    sports: [
      "M.A. Chidambaram Stadium",
      "Jawaharlal Nehru Stadium",
      "Chennai Hockey Stadium",
      "SDAT Tennis Stadium",
    ],
    concerts: [
      "YMCA Grounds Nandanam",
      "Island Grounds",
      "VGP Grounds",
      "Chennai Trade Centre",
    ],
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({ ...prev, [name]: files ? files[0] : value }));
  };

  const handleVenueChange = (e) => {
    const { name, value } = e.target;
    setVenue((prev) => ({ ...prev, [name]: value }));
  };

  const handleTimingChange = (index, field, value) => {
    const newTimings = [...venue.timings];
    newTimings[index][field] = value;
    setVenue((prev) => ({ ...prev, timings: newTimings }));
  };

  const addTiming = () =>
    setVenue((prev) => ({
      ...prev,
      timings: [...prev.timings, { fromTime: "", toTime: "", totalSeats: "" }],
    }));

  const removeTiming = (index) =>
    setVenue((prev) => ({
      ...prev,
      timings: prev.timings.filter((_, i) => i !== index),
    }));

const handleSubmit = async (e) => {
  e.preventDefault();

  // 🚨 Basic validation
  if (!venue.location || !venue.startDate || !venue.endDate) {
    alert("Please fill location, start date, and end date");
    return;
  }

  try {
    const data = new FormData();
    if (formData.poster) data.append("poster", formData.poster);
    if (formData.seatMap) data.append("seatMap", formData.seatMap);
    data.append("category", formData.category);
    data.append("eventName", formData.eventName);

    // ✅ Clean timings
    const cleanedTimings = venue.timings.filter(
      (t) => t.fromTime && t.toTime && t.totalSeats
    );

    const venueData = {
      location: venue.location,
      startDate: venue.startDate,
      endDate: venue.endDate,
      ticketPrice: Number(venue.ticketPrice),
      timings: cleanedTimings.map((t) => ({
        fromTime: t.fromTime,
        toTime: t.toTime,
        totalSeats: Number(t.totalSeats),
      })),
    };

    data.append("venues", JSON.stringify([venueData]));

    // ✅ get token
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.error("No token found. Please login again.");
      return;
    }

    // ✅ API call
    const res = await axios.post("http://localhost:5000/api/v1/events", data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("Event created:", res.data);
    navigate("/dashboard");
  } catch (error) {
    console.error(error.response?.data || error);
    alert(error.response?.data?.error || "Error creating event");
  }
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

        <h2>Organise the Event</h2>
        <form onSubmit={handleSubmit} className="event-details-form">
          <label>
            Category
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="">Select category</option>
              <option value="movies">Movies</option>
              <option value="sports">Sports</option>
              <option value="concerts">Concerts</option>
            </select>
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

          <label>
            Location
            <select
              name="location"
              value={venue.location}
              onChange={handleVenueChange}
              disabled={!formData.category}
            >
              <option value="">Select location</option>
              {formData.category &&
                chennaiLocations[formData.category]?.map((loc, i) => (
                  <option key={i} value={loc}>
                    {loc}
                  </option>
                ))}
            </select>
          </label>

          {/* ✅ Start Date */}
          <label>
            Start Date
            <input
              type="date"
              name="startDate"
              value={venue.startDate}
              onChange={handleVenueChange}
            />
          </label>

          {/* ✅ End Date */}
          <label>
            End Date
            <input
              type="date"
              name="endDate"
              value={venue.endDate}
              onChange={handleVenueChange}
            />
          </label>

          <label>
            Ticket Price
            <input
              type="number"
              name="ticketPrice"
              value={venue.ticketPrice}
              onChange={handleVenueChange}
              min="1"
            />
          </label>

          <label>
            Poster
            <input
              type="file"
              name="poster"
              accept="image/*"
              onChange={handleChange}
            />
          </label>

          <label>
            Seat Map
            <input
              type="file"
              name="seatMap"
              accept="image/*,application/pdf"
              onChange={handleChange}
            />
          </label>

          <h3>Show Timings</h3>
          {venue.timings.map((t, i) => (
            <div key={i} className="timing-row">
              <input
                type="time"
                value={t.fromTime}
                onChange={(e) =>
                  handleTimingChange(i, "fromTime", e.target.value)
                }
              />
              <input
                type="time"
                value={t.toTime}
                onChange={(e) =>
                  handleTimingChange(i, "toTime", e.target.value)
                }
              />
              <input
                type="number"
                placeholder="Seats"
                value={t.totalSeats}
                onChange={(e) =>
                  handleTimingChange(i, "totalSeats", e.target.value)
                }
                min="1"
              />
              {i > 0 && (
                <button type="button" onClick={() => removeTiming(i)}>
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addTiming}>
            Add Another Show
          </button>

          <button type="submit">Organize</button>
        </form>
      </div>
    </div>
  );
}



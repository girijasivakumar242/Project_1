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
    startDate: "",
    endDate: "",
    location: "",
    ticketPrice: "",
    poster: null,
    seatMap: null,           // added seatMap
  });

  const [timings, setTimings] = useState([{ fromTime: "", toTime: "" }]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

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
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleTimingChange = (index, field, value) => {
    const newTimings = [...timings];
    newTimings[index][field] = value;
    setTimings(newTimings);
  };

  const addTiming = () => setTimings([...timings, { fromTime: "", toTime: "" }]);

  const removeTiming = (index) => {
    const newTimings = timings.filter((_, i) => i !== index);
    setTimings(newTimings);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();

      // Append all form fields including files
      Object.keys(formData).forEach((key) => {
        if ((key === "poster" || key === "seatMap") && formData[key]) {
          data.append(key, formData[key]);
        } else if (formData[key]) {
          data.append(key, formData[key]);
        }
      });

      timings.forEach((t) => data.append("timings", JSON.stringify(t)));

      await axios.post("http://localhost:5000/api/v1/events", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate("/organiser-events");
      setMessage("Event Created Successfully!");
      setMessageType("success");

      setFormData({
        category: "",
        eventName: "",
        startDate: "",
        endDate: "",
        location: "",
        ticketPrice: "",
        poster: null,
        seatMap: null,
      });
      setTimings([{ fromTime: "", toTime: "" }]);
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
          <button className="home-btn" onClick={() => navigate("/")}>🏠</button>
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
              <select name="category" value={formData.category} onChange={handleChange}>
                <option value="">Select category</option>
                <option value="movies">Movie</option>
                <option value="sports">Sport</option>
                <option value="concerts">Concert</option>
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

            <label>
              Location
              <select
                name="location"
                value={formData.location}
                onChange={handleChange}
                disabled={!formData.category}
              >
                <option value="">Select location</option>
                {formData.category &&
                  chennaiLocations[formData.category]?.map((loc, index) => (
                    <option key={index} value={loc}>
                      {loc}
                    </option>
                  ))}
              </select>
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

            {/* New seatMap input */}
            <label className="icon-input file-upload">
              Seat Map
              <input
                type="file"
                name="seatMap"
                accept="image/*,application/pdf" // allow images & pdf for seat maps
                onChange={handleChange}
              />
            </label>
          </div>

          <h3>Show Timings</h3>
          {timings.map((t, index) => (
            <div key={index} className="timing-row">
              <label>
                From Time
                <input
                  type="time"
                  value={t.fromTime}
                  onChange={(e) => handleTimingChange(index, "fromTime", e.target.value)}
                />
              </label>
              <label>
                To Time
                <input
                  type="time"
                  value={t.toTime}
                  onChange={(e) => handleTimingChange(index, "toTime", e.target.value)}
                />
              </label>
              {index > 0 && (
                <button type="button" onClick={() => removeTiming(index)}>
                  ❌ Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addTiming} className="add-timing-btn">
            ➕ Add Another Show
          </button>

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

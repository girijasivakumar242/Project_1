import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Remainder.css";

export default function Remainder() {
  const [bookings, setBookings] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reminderTime, setReminderTime] = useState("");
  const [message, setMessage] = useState("");

  // ✅ Fetch bookings for logged-in user (via JWT cookie)
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/v1/bookings/user", 
          { withCredentials: true } // 👈 send JWT cookie
        );

        console.log("✅ API Response:", res.data);
        setBookings(res.data);
      } catch (err) {
        console.error("❌ Failed to load bookings:", err);
      }
    };

    fetchBookings();

    // 🔹 Load reminders from localStorage
    const saved = JSON.parse(localStorage.getItem("reminders") || "[]");
    setReminders(saved);
  }, []);

  // ✅ Save reminder
  const handleSaveReminder = () => {
    if (!selectedBooking || !reminderTime) {
      setMessage("⚠️ Please select an event and a time.");
      return;
    }

    if (
      reminders.some(
        (r) =>
          r.bookingId === selectedBooking._id &&
          new Date(r.time).getTime() === new Date(reminderTime).getTime()
      )
    ) {
      setMessage("⚠️ Reminder already set for this time.");
      return;
    }

    const newReminder = {
      bookingId: selectedBooking._id,
      eventName: selectedBooking.eventName,
      seats: selectedBooking.seats,
      venue: selectedBooking.venue?.location || "N/A",
      timing: selectedBooking.timing
        ? `${selectedBooking.timing.fromTime} - ${selectedBooking.timing.toTime}`
        : "N/A",
      time: reminderTime,
    };

    const updated = [...reminders, newReminder].sort(
      (a, b) => new Date(a.time) - new Date(b.time)
    );

    setReminders(updated);
    localStorage.setItem("reminders", JSON.stringify(updated));

    setMessage("✅ Reminder set successfully!");
    setSelectedBooking(null);
    setReminderTime("");
  };

  // ✅ Delete reminder
  const handleDeleteReminder = (index) => {
    const updated = reminders.filter((_, i) => i !== index);
    setReminders(updated);
    localStorage.setItem("reminders", JSON.stringify(updated));
    setMessage("🗑️ Reminder deleted.");
  };

  return (
    <div className="remainder-container">
      <h2>🔔 Event Reminders</h2>

      <h3>Your Booked Events</h3>
      {bookings.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        <ul>
          {bookings.map((b) => (
            <li key={b._id}>
              <span>
                {b.eventName} – Seats: {b.seats.join(", ")}
                {b.venue && ` – 📍 ${b.venue.location}`}
                {b.timing && ` – ⏰ ${b.timing.fromTime} to ${b.timing.toTime}`}
              </span>
              <button onClick={() => setSelectedBooking(b)}>Set Reminder</button>
            </li>
          ))}
        </ul>
      )}

      {selectedBooking && (
        <div className="reminder-form">
          <h4>Set reminder for {selectedBooking.eventName}</h4>
          <input
            type="datetime-local"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
          />
          <button onClick={handleSaveReminder}>Save Reminder</button>
          <button onClick={() => setSelectedBooking(null)}>Cancel</button>
        </div>
      )}

      {message && <p className="message">{message}</p>}

      <h3>⏰ Your Reminders</h3>
      {reminders.length === 0 ? (
        <p>No reminders set.</p>
      ) : (
        <ul>
          {reminders.map((r, index) => (
            <li key={index}>
              <span>
                {r.eventName} – Seats: {r.seats.join(", ")} – 📍 {r.venue} – ⏰{" "}
                {r.timing} – Reminder at: {new Date(r.time).toLocaleString()}
              </span>
              <button onClick={() => handleDeleteReminder(index)}>❌ Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

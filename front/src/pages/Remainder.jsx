import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Remainder.css";

export default function Remainder() {
  const [bookings, setBookings] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // ✅ Fetch bookings for logged-in user
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const res = await axios.get(
          `http://localhost:5000/api/v1/bookings/user/${userId}`,
          { withCredentials: true }
        );
        setBookings(res.data);
      } catch (err) {
        console.error("❌ Failed to load bookings:", err);
      }
    };

    fetchBookings();

    // ✅ Load reminders + toggle state (specific to user)
    const userId = localStorage.getItem("userId");
    const savedReminders = JSON.parse(localStorage.getItem(`reminders_${userId}`) || "[]");
    setReminders(savedReminders);

    const savedToggle = localStorage.getItem("notificationsEnabled") === "true";
    setNotificationsEnabled(savedToggle);
  }, []);

  useEffect(() => {
    if (notificationsEnabled && bookings.length > 0) {
      const autoReminders = bookings.flatMap((b) => {
        if (!b.eventDate || !b.timings) return [];

        return b.timings.map((t) => {
          const eventDateTime = new Date(b.eventDate);
          if (t?.fromTime) {
            const [hours, minutes] = t.fromTime.split(":");
            eventDateTime.setHours(hours, minutes, 0, 0);
          } else {
            eventDateTime.setHours(10, 0, 0, 0);
          }

          const reminderTime = new Date(eventDateTime.getTime() - 30 * 60000);
          return {
            bookingId: b.bookingId,
            eventName: b.eventName,
            eventDate: b.eventDate,
            seats: b.seats || [],
            venue: b.venue?.location || "N/A",
            timing: `${t.fromTime}`,
            time: reminderTime,
          };
        });
      });

      // ✅ Filter only upcoming reminders
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const upcomingReminders = autoReminders.filter((r) => {
        const eventDate = new Date(r.eventDate);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
      });

      // ✅ Save per-user reminders
      const userId = localStorage.getItem("userId");
      setReminders(upcomingReminders);
      localStorage.setItem(`reminders_${userId}`, JSON.stringify(upcomingReminders));
    }

    localStorage.setItem("notificationsEnabled", notificationsEnabled);
  }, [notificationsEnabled, bookings]);

  return (
    <div className="remainder-container">
      <h2>🔔 Event Reminders</h2>

      {/* Toggle */}
      <label className="toggle">
        Enable Notification
        <input
          type="checkbox"
          checked={notificationsEnabled}
          onChange={(e) => setNotificationsEnabled(e.target.checked)}
        />
        <span className="slider"></span>
      </label>

      <h3>Your Reminders</h3>
      {reminders.length === 0 ? (
        <p>No reminders set.</p>
      ) : (
        <ul className={!notificationsEnabled ? "reminder-list disabled" : "reminder-list"}>
          {reminders.map((r, i) => {
            const eventDate = new Date(r.eventDate);
            const dayName = eventDate.toLocaleDateString("en-US", { weekday: "long" });
            const dateFormatted = eventDate.toLocaleDateString("en-GB"); // dd/mm/yy

            return (
              <li key={`${r.bookingId}-${i}`} className="reminder-item">
                <div className="reminder-date">
                  <strong>{dayName}</strong>
                  <span>{dateFormatted}</span>
                </div>
                <div className="reminder-time">{r.timing}</div>
                <div className="reminder-details">
                  <div className="event-name">{r.eventName}</div>
                  <div className="venue">{r.venue}</div>
                  {r.seats.length > 0 && (
                    <div className="seats">Seats: {r.seats.join(", ")}</div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

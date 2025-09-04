import React, { useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

import HomePage from "./pages/Home.jsx";
import SignInPage from "./pages/SignInPage.jsx";
import OrganiserDashboard from "./pages/OrganiserDashboard.jsx";
import CreateEventLanding from "./pages/CreateEventLanding.jsx";
import CreateEventForm from "./pages/CreateEventForm.jsx";
import AudienceDashboard from "./pages/AudienceDashboard.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";
import EventDetails from "./pages/EventDetails.jsx";
import SeatMap from "./pages/SeatMap";
import Dashboard from "./pages/Dashboard.jsx";
import BookingStatus from "./pages/BookingStatus.jsx";

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("role");
    const userId = localStorage.getItem("userId");
    const justLoggedIn = localStorage.getItem("justLoggedIn") === "true";

    if (!token) return;

    const checkOrganiserEvents = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/v1/events/organiser/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data && res.data.length > 0) {
          // organiser has events → dashboard
          navigate("/dashboard", { replace: true });
        } else {
          // no events → new organiser → organiser dashboard
          navigate("/organiser-dashboard", { replace: true });
        }
      } catch (err) {
        console.error("Error fetching organiser events:", err);
        navigate("/organiser-dashboard", { replace: true });
      }
    };

    if (role === "organiser") {
      if (justLoggedIn || location.pathname === "/signin") {
        checkOrganiserEvents();
        localStorage.removeItem("justLoggedIn");
      }
    } else if (role === "audience") {
      if (justLoggedIn || location.pathname === "/signin") {
        navigate("/audience-dashboard", { replace: true });
        localStorage.removeItem("justLoggedIn");
      }
    }
  }, [navigate, location]);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/organiser-dashboard" element={<OrganiserDashboard />} />
      <Route path="/create-event-landing" element={<CreateEventLanding />} />
      <Route path="/create-event-form" element={<CreateEventForm />} />
      <Route path="/audience-dashboard" element={<AudienceDashboard />} />
      <Route path="/category/:category" element={<CategoryPage />} />
      <Route path="/event/:id" element={<EventDetails />} />
      <Route path="/seatmap/:eventId/:location" element={<SeatMap />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/booking-status/:eventId" element={<BookingStatus />} />
    </Routes>
  );
}

export default App;

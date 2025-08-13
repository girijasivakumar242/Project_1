import React, { useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import HomePage from "./pages/Home.jsx";
import SignInPage from "./pages/SignInPage.jsx";
import OrganiserDashboard from "./pages/OrganiserDashboard.jsx";
import CreateEventLanding from "./pages/CreateEventLanding.jsx";
import CreateEventForm from "./pages/CreateEventForm.jsx"; // 📌 Import the new form
import AudienceDashboard from "./pages/AudienceDashboard.jsx";
function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("role");
    const companyVerified = localStorage.getItem("companyVerified") === "true";
    const justLoggedIn = localStorage.getItem("justLoggedIn") === "true";

    if (!token) return; // Not logged in → no redirect

    // 🚀 Redirect immediately after login
    if (justLoggedIn) {
      if (role === "organiser") {
        navigate(
          companyVerified ? "/create-event-landing" : "/organiser-dashboard",
          { replace: true }
        );
      }
      localStorage.removeItem("justLoggedIn");
      return;
    }

    // 🔄 Returning session: only redirect if on wrong page
    if (role === "organiser") {
      if (companyVerified && location.pathname === "/organiser-dashboard") {
        navigate("/create-event-landing", { replace: true });
      } else if (!companyVerified && location.pathname === "/create-event-landing") {
        navigate("/organiser-dashboard", { replace: true });
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
      <Route path="/audience-dashboard" element={<AudienceDashboard />} /> {/* ✅ New route */}
    </Routes>
  );
}

export default App;

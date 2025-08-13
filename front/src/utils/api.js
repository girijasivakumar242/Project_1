import React, { useState } from "react";
import "../styles/OrganiserDashboard.css";
import logo from "../assets/bookd-logo.png";
import { useNavigate } from "react-router-dom";
import api from "../utils/api"; // <-- import the axios instance

export default function OrganiserDashboard() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    businessId: "",
    phoneNumber: "",
    gstNumber: "",
    aadharNumber: "",
    accountNumber: "",
    ifscCode: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      // Use api instead of axios directly, no need to pass token manually
      const res = await api.post("/companies", form);

      console.log("Response from server:", res.data);
      setMessage("✅ Company registered successfully 🎉");

      setTimeout(() => navigate("/create-event-landing"), 1000);
    } catch (err) {
      console.error("Error during registration:", err);
      console.error("Backend response:", err.response?.data);

      setMessage(
        err.response?.data?.message || "❌ Registration failed — please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="organiser-dashboard">
      <header className="header">
        <div className="logo-section">
          <img src={logo} alt="BOOKD Logo" className="logo" />
          <nav>
            <a href="#">Explore events</a>
            <a href="#">About us</a>
          </nav>
        </div>
        <div className="user-section">
          <span>Greetings!!</span>
          <strong>JUDI</strong>
          <button className="home-btn" onClick={() => navigate("/")}>
            🏠
          </button>
        </div>
      </header>

      <main className="form-container">
        <h2>Register your company</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Business ID
            <input
              type="text"
              name="businessId"
              value={form.businessId}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Phone Number
            <input
              type="tel"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
              placeholder="+91"
              required
            />
          </label>

          <label>
            GST Number
            <input
              type="text"
              name="gstNumber"
              value={form.gstNumber}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Aadhar Number
            <input
              type="text"
              name="aadharNumber"
              value={form.aadharNumber}
              onChange={handleChange}
              required
            />
          </label>

          <h3>Account Details</h3>
          <div className="account-section">
            <label>
              Account Number
              <input
                type="text"
                name="accountNumber"
                value={form.accountNumber}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              IFSC Code
              <input
                type="text"
                name="ifscCode"
                value={form.ifscCode}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <button type="submit" className="verify-btn" disabled={loading}>
            {loading ? "Verifying..." : "VERIFY"}
          </button>
        </form>

        {message && <p className="message">{message}</p>}
      </main>
    </div>
  );
}

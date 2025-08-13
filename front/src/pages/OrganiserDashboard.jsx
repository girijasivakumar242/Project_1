import React, { useState } from "react";
import "../styles/OrganiserDashboard.css";
import logo from "../assets/bookd-logo.png";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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

  const validateForm = () => {
    const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile numbers
    const aadharRegex = /^\d{12}$/;
    const accountRegex = /^\d{9,18}$/;
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    const gstRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (!phoneRegex.test(form.phoneNumber)) {
      return "❌ Invalid phone number. Must be 10 digits starting with 6–9.";
    }
    if (!aadharRegex.test(form.aadharNumber)) {
      return "❌ Invalid Aadhaar number. Must be exactly 12 digits.";
    }
    if (!accountRegex.test(form.accountNumber)) {
      return "❌ Invalid account number. Must be 9–18 digits.";
    }
    if (!ifscRegex.test(form.ifscCode)) {
      return "❌ Invalid IFSC code format.";
    }
    if (!gstRegex.test(form.gstNumber)) {
      return "❌ Invalid GST number format.";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const error = validateForm();
    if (error) {
      setMessage(error);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      const res = await axios.post(
        "http://localhost:5000/api/v1/companies",
        form,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      setMessage("✅ Company registered successfully 🎉");
      localStorage.setItem("companyVerified", "true");

      setTimeout(() => navigate("/create-event-landing"), 1000);
    } catch (err) {
      setMessage(err.response?.data?.message || "❌ Registration failed — please try again.");
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
          <strong>{localStorage.getItem("username") || "Guest"}</strong>
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

import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/SignInPage.css";
import logo from "../assets/bookd-logo.png";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

export default function SignInPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullname: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "audience",
  });

  // ✅ Clear old session data on first load
  useEffect(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("role");
    localStorage.removeItem("companyVerified");
    localStorage.removeItem("username");
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ===== LOGIN =====
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/v1/users/login",
        { email: formData.email, password: formData.password },
        { withCredentials: true }
      );

      const data = res.data?.data;

      if (data?.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("role", data.role);
        localStorage.setItem("companyVerified", data.companyVerified);
        localStorage.setItem("username", data.username);
        localStorage.setItem("userId", data._id);
        localStorage.setItem(
          "loggedInUserEmail",
          data?.email ? data.email : formData.email
        );
      }

      setFormData({
        fullname: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "audience",
      });

      setMessage("Login successful ✅");

      if (data.role === "organiser") {
        if (data.companyVerified) {
          if (data.hasEvents) {
            navigate("/dashboard");
          } else {
            navigate("/create-event-landing");
          }
        } else {
          navigate("/organiser-dashboard");
        }
      } else if (data.role === "audience") {
        navigate("/audience-dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Login failed ❌");
    }
  };

  // ===== SIGN UP =====
  const handleSignUp = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match ❌");
      return;
    }

    try {
      const endpoint =
        formData.role === "audience"
          ? "http://localhost:5000/api/v1/users/register-audience"
          : "http://localhost:5000/api/v1/users/register-organiser";

      const payload = {
        fullname: formData.fullname,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      const res = await axios.post(endpoint, payload, {
        withCredentials: true,
      });

      const data = res.data?.data;

      if (data?.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("role", data.role);
        localStorage.setItem("companyVerified", data.companyVerified);
        localStorage.setItem("username", data.username);
        localStorage.setItem(
          "loggedInUserEmail",
          data?.email ? data.email : formData.email
        );
      }

      setFormData({
        fullname: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "audience",
      });

      setMessage("Account created 🎉");

      if (data?.role === "audience") {
        navigate("/audience-dashboard");
      } else if (data?.role === "organiser") {
        if (data?.companyVerified) {
          navigate("/create-event-landing");
        } else {
          navigate("/organiser-dashboard");
        }
      } else {
        navigate("/");
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Sign up failed ❌");
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
  try {
    const res = await axios.post(
      "http://localhost:5000/api/v1/auth/google",
      { credential: credentialResponse.credential },
      { withCredentials: true }
    );

    const { user,accessToken } = res.data;

    if (user) {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("username", user.username);
      localStorage.setItem("loggedInUserEmail", user.email);
      localStorage.setItem("userId", user._id);

      setMessage("Google Sign-In successful ✅");
      navigate("/audience-dashboard");
    }
  } catch (err) {
    console.error("Google login error:", err);
    setMessage("Google Sign-In failed ❌");
  }
};


  return (
    <GoogleOAuthProvider clientId="988384786626-7mfbidqojb7e2g68f54kddia28tl9tii.apps.googleusercontent.com">
      <div className="signin-page">
        <div className={`signin-card ${isSignUp ? "compact" : ""}`}>
          <button className="close-btn">&times;</button>

          <img src={logo} alt="BOOKD Logo" className="logo" />
          <h2 className="signin-title">
            {isSignUp ? "Get Started Now" : "Welcome back!"}
          </h2>

          <form
            onSubmit={isSignUp ? handleSignUp : handleLogin}
            className="signin-form"
          >
            {isSignUp && (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="fullname"
                    placeholder="Enter your full name"
                    value={formData.fullname}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    name="username"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>
                Password
                {!isSignUp && (
                  <span className="forgot-password">forgot password?</span>
                )}
              </label>
              <input
                type="password"
                name="password"
                placeholder="********"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {isSignUp && (
              <>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="********"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Select User Type</label>
                  <div className="radio-group">
                    <label>
                      <input
                        type="radio"
                        name="role"
                        value="audience"
                        checked={formData.role === "audience"}
                        onChange={handleChange}
                      />
                      User
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="role"
                        value="organiser"
                        checked={formData.role === "organiser"}
                        onChange={handleChange}
                      />
                      Organiser
                    </label>
                  </div>
                </div>
              </>
            )}

            <button type="submit" className="login-btn">
              {isSignUp ? "Sign Up" : "Login"}
            </button>
          </form>

          <div className="social-login">
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => setMessage("Google Sign-In failed ❌")}
              useOneTap
            />
          </div>

          <p className="signup-text">
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <a
                  href="#"
                  className="link-text"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsSignUp(false);
                  }}
                >
                  Sign In
                </a>
              </>
            ) : (
              <>
                Don’t have an account?{" "}
                <a
                  href="#"
                  className="link-text"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsSignUp(true);
                  }}
                >
                  Sign Up
                </a>
              </>
            )}
          </p>

          {message && <p className="message">{message}</p>}
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

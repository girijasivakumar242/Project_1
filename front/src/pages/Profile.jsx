import React, { useState, useEffect } from "react";
import "../styles/Profile.css";

export default function Profile() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [photo, setPhoto] = useState(null);
// ✅ Load saved profile based on email (only after login)
useEffect(() => {
  const loggedInEmail = localStorage.getItem("loggedInUserEmail"); // email saved during login
  if (loggedInEmail) {
    const savedProfile = JSON.parse(localStorage.getItem(`profile_${loggedInEmail}`));
    if (savedProfile) {
      setName(savedProfile.name || "");
      setEmail(savedProfile.email || loggedInEmail);
      setGender(savedProfile.gender || "");
      setDob(savedProfile.dob || "");
      setPhoto(savedProfile.photo || null);
    } else {
      // New user, show blank profile but pre-fill email
      setEmail(loggedInEmail);
    }
  }
}, []);

const handleSave = () => {
  const loggedInEmail = localStorage.getItem("loggedInUserEmail");
  if (!loggedInEmail) {
    alert("No logged in user found!");
    return;
  }

  const profile = { name, email: loggedInEmail, gender, dob, photo };

  // ✅ Always use loggedInEmail as key
  localStorage.setItem(`profile_${loggedInEmail}`, JSON.stringify(profile));

  // ✅ Save name for AudienceDashboard greeting
  localStorage.setItem(`userName_${loggedInEmail}`, name);

  alert("Profile saved successfully!");
  window.location.href = "/audience-dashboard";
};




  // ✅ Handle photo upload
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="profile-form">
      <h2>Profile</h2>

      <div className="profile-photo">
        {photo ? (
          <img src={photo} alt="Profile" />
        ) : (
          <div className="photo-placeholder">Add photo</div>
        )}
        <input type="file" accept="image/*" onChange={handlePhotoChange} />
      </div>

      <label>Name</label>
      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <label>Email Address</label>
      <input
  type="email"
  placeholder="Enter your email"
  value={email}
  readOnly
/>

      <label>Identity (Optional)</label>
      <div className="gender-options">
        <button
          className={gender === "woman" ? "active" : ""}
          onClick={() => setGender("woman")}
          type="button"
        >
          Woman
        </button>
        <button
          className={gender === "man" ? "active" : ""}
          onClick={() => setGender("man")}
          type="button"
        >
          Man
        </button>
      </div>

      <label>D.O.B (Optional)</label>
      <input
        type="date"
        value={dob}
        onChange={(e) => setDob(e.target.value)}
      />

      <button className="save-btn" onClick={handleSave}>
        Save Profile
      </button>
    </div>
  );
}

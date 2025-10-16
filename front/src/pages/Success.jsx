
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";


export default function Success() {
  const navigate = useNavigate();

  useEffect(() => {
    // Optional: clear selected seats or booking info
    localStorage.removeItem("selectedSeats");
  }, []);

  return (
    <div className="payment-result success">
      <h1>🎉 Payment Successful!</h1>
      <p>Your ticket has been booked successfully.</p>
      <button onClick={() => navigate("/")}>Go Back to Home</button>
    </div>
  );
}

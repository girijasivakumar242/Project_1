// src/pages/Cancel.jsx
import React from "react";
import { useNavigate } from "react-router-dom";


export default function Cancel() {
  const navigate = useNavigate();

  return (
    <div className="payment-result cancel">
      <h1>❌ Payment Canceled</h1>
      <p>Your transaction was canceled. You can try again anytime.</p>
      <button onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );
}

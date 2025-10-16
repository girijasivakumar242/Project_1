import React from "react";
import "../styles/PaymentPopup.css";

export default function PaymentPopup({ isOpen, onClose, eventName, location, timing, ticketPrice, seatCount, onProceed }) {
  if (!isOpen) return null;

  const sGst = 15;
  const intermediate = 15;
  const total = seatCount * ticketPrice + sGst + intermediate;

  return (
    <div className="popup-overlay">
      <div className="popup-container">
        <button className="close-btn" onClick={onClose}>✖</button>
        <h2>{eventName}</h2>
        <p><strong>{location}</strong> <span className="time">{timing}</span></p>

        <div className="price-details">
          <p><strong>Ticket Price</strong> : {ticketPrice}rs x {seatCount}</p>
          <p><strong>sGst & cGst</strong> : {sGst}rs</p>
          <p><strong>intermediate cost</strong> : {intermediate}rs</p>
          <hr />
          <p className="total"><strong>Total Price :</strong> {total}rs</p>
        </div>

        <button className="proceed-btn" onClick={onProceed}>Proceed</button>
      </div>
    </div>
  );
}

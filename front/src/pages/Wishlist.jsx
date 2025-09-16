import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Wishlist.css";
export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const loggedInEmail = localStorage.getItem("loggedInUserEmail");
  const token = localStorage.getItem("accessToken"); // ✅ JWT

  useEffect(() => {
    if (loggedInEmail && token) {
      axios
        .get(`http://localhost:5000/api/v1/wishlist/${loggedInEmail}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setWishlist(res.data))
        .catch((err) => console.error(err));
    }
  }, [loggedInEmail, token]);

  return (
    <div>
      <h2>Your Wishlist ❤️</h2>
      <div className="wishlist-container">
        {wishlist.map((event) => (
          <div key={event._id} className="wishlist-card">
            <img
              src={`http://localhost:5000${event.poster}`}
              alt={event.eventName}
            />
            <h3>{event.eventName}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

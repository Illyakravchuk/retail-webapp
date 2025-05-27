import { useEffect, useState } from "react";
import axios from "axios";

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios.get("http://localhost:3000/profile", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setUser(res.data.user))
    .catch(err => console.error("Не вдалося отримати профіль", err));
  }, []);

  if (!user) return <p className="text-center mt-20">Завантаження профілю...</p>;

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-6 rounded shadow text-center">
      <h1 className="text-2xl font-bold mb-4">Профіль користувача</h1>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Роль:</strong> {user.role}</p>
    </div>
  );
}

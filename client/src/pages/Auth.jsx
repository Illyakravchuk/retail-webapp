import React, { useEffect, useState } from "react";
import axios from "axios";
import AuthGraphic from "../assets/auth-graphic.png";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

// Перевірка валідності паролю
function isValidPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState("");
  const [error, setError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    if (isLogin || role !== "cashier") return;
    (async () => {
      try {
        const { data } = await axios.get("http://localhost:3000/stores-lite");
        setStores(data);
      } catch {
        setError("Не вдалося отримати перелік магазинів");
      }
    })();
  }, [isLogin, role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isLogin && role === "cashier" && !storeId)
      return setError("Для касира оберіть магазин");

    if (!isLogin && !isValidPassword(password)) {
      setError("Пароль має містити мінімум 8 символів, одну велику, одну малу літеру і одну цифру");
      return;
    }

    const url = isLogin
      ? "http://localhost:3000/login"
      : "http://localhost:3000/register";

    const payload = isLogin
      ? { email, password }
      : role === "cashier"
      ? { email, password, role, storeId: Number(storeId), firstName, lastName }
      : { email, password, role, firstName, lastName };

    try {
      const { data } = await axios.post(url, payload);

      if (isLogin) {
        localStorage.setItem("token", data.token);
        window.location.href = "/profile";
      } else {
        setSnack({
          open: true,
          message: "Реєстрація успішна! Тепер увійдіть.",
          severity: "success",
        });
        setIsLogin(true);
        setPassword("");
      }
    } catch {
      setError("Невірні дані або email вже використовується");
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-gray-100">
      {/* Ліва синя колонка */}
      <div className="w-1/3 bg-blue-600 text-white p-10 flex items-center justify-center">
        <div>
          <h2 className="text-4xl font-extrabold mb-6 leading-tight">
            Retail WebApp
          </h2>
          <p className="text-xl leading-relaxed">
            Авторизуйтеся або зареєструйтеся, щоб отримати доступ до системи керування мережею магазинів.
          </p>
        </div>
      </div>

      {/* Середня колонка з формою */}
      <div className="w-1/3 bg-blue-100 p-10 flex items-center justify-center">
        <div className="w-full max-w-sm">
          <h2 className="text-3xl font-bold mb-6 text-center">
            {isLogin ? "Вхід" : "Реєстрація"}
          </h2>

          {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* email */}
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
              />
            </div>
            {/* password */}
            <div>
              <label className="block text-sm font-medium mb-1">Пароль</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
              />
              {!isLogin && (
                <span className="text-xs text-gray-600">
                  Мінімум 8 символів, одна велика, одна мала літера і одна цифра
                </span>
              )}
            </div>
            {/* Додаткові поля лише при реєстрації */}
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Ім'я</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Прізвище</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Роль</label>
                  <select
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value);
                      setStoreId("");
                    }}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                  >
                    <option value="user">Користувач</option>
                    <option value="cashier">Касир</option>
                    <option value="admin">Адміністратор</option>
                  </select>
                </div>
                {role === "cashier" && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Магазин</label>
                    <select
                      value={storeId}
                      onChange={(e) => setStoreId(e.target.value)}
                      required
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                    >
                      <option value="">— Оберіть магазин —</option>
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (ID&nbsp;{s.id})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}
            {/* Кнопка */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              {isLogin ? "Увійти" : "Зареєструватись"}
            </button>
          </form>
          {/* Перемикач форми */}
          <p className="mt-4 text-center text-sm text-gray-700">
            {isLogin ? "Не маєте акаунту?" : "Вже є акаунт?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:underline"
            >
              {isLogin ? "Зареєструватись" : "Увійти"}
            </button>
          </p>
        </div>
      </div>
      {/* Права ілюстрація */}
      <div className="w-1/3">
        <img
          src={AuthGraphic}
          alt="Retail illustration"
          className="w-full h-full object-cover"
        />
      </div>
      {/* Snackbar pop-up */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack({ ...snack, open: false })}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

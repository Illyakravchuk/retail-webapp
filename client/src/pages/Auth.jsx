import React, { useState } from 'react';
import axios from 'axios';
import AuthGraphic from '../assets/auth-graphic.png'; 

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); 
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const url = isLogin
      ? 'http://localhost:3000/login'
      : 'http://localhost:3000/register';

    const payload = isLogin ? { email, password } : { email, password, role };

    try {
      const { data } = await axios.post(url, payload);
      if (isLogin) {
        localStorage.setItem('token', data.token);
        window.location.href = '/profile';
      } else {
        alert('Реєстрація успішна! Тепер увійдіть.');
        setIsLogin(true);
      }
    } catch {
      setError('Неправильні облікові дані або помилка');
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-gray-100">
      <div className="w-1/3 bg-blue-600 text-white p-10 flex items-center justify-center">
        <div>
          <h2 className="text-4xl font-extrabold mb-6 leading-tight">Retail WebApp</h2>
          <p className="text-xl leading-relaxed">
            Авторизуйтеся або зареєструйтеся, щоб отримати доступ до системи керування мережею магазинів.
          </p>
        </div>
      </div>

      <div className="w-1/3 bg-blue-100 p-10 flex items-center justify-center">
        <div className="w-full max-w-sm">
          <h2 className="text-3xl font-bold mb-6 text-center">
            {isLogin ? 'Вхід' : 'Реєстрація'}
          </h2>

          {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <label className="block text-sm font-medium mb-1">Пароль</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-1">Роль</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                >
                  <option value="user">Користувач</option>
                  <option value="cashier">Касир</option>
                  <option value="admin">Адміністратор</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              {isLogin ? 'Увійти' : 'Зареєструватись'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-700">
            {isLogin ? 'Не маєте акаунту?' : 'Вже є акаунт?'}{' '}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:underline"
            >
              {isLogin ? 'Зареєструватись' : 'Увійти'}
            </button>
          </p>
        </div>
      </div>

      <div className="w-1/3">
        <img
          src={AuthGraphic}
          alt="Retail illustration"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}

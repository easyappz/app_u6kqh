import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { login as loginRequest } from '../../../api/auth';

const Login = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const trimmedUsername = username.trim();

    if (!trimmedUsername || !password.trim()) {
      setError('Пожалуйста, введите логин и пароль.');
      return;
    }

    try {
      setIsSubmitting(true);
      const data = await loginRequest({ username: trimmedUsername, password });

      if (data && data.token) {
        window.localStorage.setItem('authToken', data.token);
      }

      navigate('/');
    } catch (err) {
      let message = 'Не удалось войти. Проверьте логин и пароль.';

      if (err && err.response && err.response.data) {
        const responseData = err.response.data;
        if (typeof responseData.detail === 'string') {
          message = responseData.detail;
        } else if (typeof responseData === 'string') {
          message = responseData;
        }
      }

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      data-easytag="id1-src/components/Auth/Login/index.jsx"
      className="auth-page auth-login"
    >
      <h1 className="auth-title">Авторизация</h1>
      <p className="auth-description">
        Введите логин и пароль, чтобы войти в систему.
      </p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-label">
          Логин
          <input
            type="text"
            className="auth-input"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Введите логин"
            autoComplete="username"
          />
        </label>
        <label className="auth-label">
          Пароль
          <input
            type="password"
            className="auth-input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Введите пароль"
            autoComplete="current-password"
          />
        </label>
        {error && <div className="auth-error">{error}</div>}
        <button
          className="auth-button"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Вход...' : 'Войти'}
        </button>
      </form>
    </div>
  );
};

export default Login;

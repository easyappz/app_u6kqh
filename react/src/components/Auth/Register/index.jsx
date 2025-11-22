import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { register as registerRequest } from '../../../api/auth';

const Register = () => {
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

    if (password.length < 4) {
      setError('Пароль должен содержать не менее 4 символов.');
      return;
    }

    try {
      setIsSubmitting(true);
      const data = await registerRequest({ username: trimmedUsername, password });

      if (data && data.token) {
        window.localStorage.setItem('authToken', data.token);
      }

      navigate('/');
    } catch (err) {
      let message = 'Произошла ошибка при регистрации.';

      if (err && err.response && err.response.data) {
        const responseData = err.response.data;
        if (typeof responseData.detail === 'string') {
          message = responseData.detail;
        } else if (typeof responseData === 'string') {
          message = responseData;
        } else if (responseData.username && Array.isArray(responseData.username)) {
          const first = responseData.username[0];
          if (typeof first === 'string') {
            message = first;
          }
        }
      }

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      data-easytag="id1-src/components/Auth/Register/index.jsx"
      className="auth-page auth-register"
    >
      <h1 className="auth-title">Регистрация</h1>
      <p className="auth-description">
        Создайте аккаунт, указав логин и пароль.
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
            autoComplete="new-password"
          />
        </label>
        {error && <div className="auth-error">{error}</div>}
        <button
          className="auth-button"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </form>
    </div>
  );
};

export default Register;

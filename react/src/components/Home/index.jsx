import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getMessages, sendMessage } from '../../api/chat';

const Home = () => {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const token =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('authToken')
        : null;

    if (!token) {
      navigate('/login');
      return;
    }

    let isMounted = true;

    const loadMessages = async () => {
      try {
        const data = await getMessages();
        if (!isMounted) {
          return;
        }

        setMessages(Array.isArray(data) ? data : []);
        setError('');
      } catch (err) {
        if (!isMounted) {
          return;
        }

        if (err && err.response && err.response.status === 401) {
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem('authToken');
          }
          navigate('/login');
          return;
        }

        setError('Не удалось загрузить сообщения. Попробуйте обновить позже.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadMessages();
    const intervalId = window.setInterval(loadMessages, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const text = newMessage.trim();
    if (!text) {
      return;
    }

    try {
      setIsSending(true);
      const created = await sendMessage(text);
      setNewMessage('');
      setMessages((prev) => [...prev, created]);
    } catch (err) {
      if (err && err.response && err.response.status === 401) {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('authToken');
        }
        navigate('/login');
        return;
      }

      setError('Не удалось отправить сообщение. Попробуйте ещё раз.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      data-easytag="id1-src/components/Home/index.jsx"
      className="home-page"
    >
      <h1 className="home-title">Групповой чат</h1>
      <p className="home-subtitle">
        Основная страница с общим чатом для всех авторизованных пользователей.
      </p>
      <div className="home-chat-container">
        {loading ? (
          <div className="home-status">Загрузка сообщений...</div>
        ) : (
          <div className="home-messages" id="chat-messages">
            {messages.length === 0 ? (
              <div className="home-status">
                Сообщений пока нет. Напишите первое!
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="home-message-item">
                  <div className="home-message-meta">
                    <span className="home-message-author">
                      {msg.author_username}
                    </span>
                    <span className="home-message-time">
                      {msg.created_at
                        ? new Date(msg.created_at).toLocaleString('ru-RU')
                        : ''}
                    </span>
                  </div>
                  <div className="home-message-text">{msg.text}</div>
                </div>
              ))
            )}
          </div>
        )}

        {error && <div className="home-error">{error}</div>}

        <form className="home-input-form" onSubmit={handleSubmit}>
          <textarea
            className="home-input"
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
            placeholder="Введите сообщение..."
            rows={3}
          />
          <button
            className="home-send-button"
            type="submit"
            disabled={isSending || !newMessage.trim()}
          >
            {isSending ? 'Отправка...' : 'Отправить'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Home;

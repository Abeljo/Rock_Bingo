import { useEffect, useState } from 'react';
import { TelegramUser, TelegramWebApp } from '../types';

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export function useTelegram() {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [authResponse, setAuthResponse] = useState<any>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize Telegram WebApp and user on mount
  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      setWebApp(window.Telegram.WebApp);
      setUser(window.Telegram.WebApp.initDataUnsafe.user || null);
    } else {
      setWebApp(null);
      setUser(null);
    }
  }, []);

  // Authenticate user by sending parsed user data to backend
  useEffect(() => {
    if (!user) return;

    fetch('http://localhost:3000/api/auth/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegram_id: user.id,
        username: user.username || '',
        first_name: user.first_name,
        last_name: user.last_name || '',
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((data) => setAuthResponse(data))
      .catch((err) => setAuthError(err.message || 'Failed to authenticate'));
  }, [user]);

  return { user, webApp, authResponse, authError };
}
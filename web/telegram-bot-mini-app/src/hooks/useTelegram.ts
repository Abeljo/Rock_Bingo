// useTelegram.ts
import { useEffect, useState } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date?: number;
  hash?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    query_id?: string;
    auth_date?: number;
    hash?: string;
    [key: string]: any;
  };
  close: () => void;
  sendData: (data: string) => void;
  expand: () => void;
  isExpanded: boolean;
  themeParams: Record<string, string>;
  colorScheme: string;
}

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

  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      setWebApp(window.Telegram.WebApp);
      setUser(window.Telegram.WebApp.initDataUnsafe.user || null);
    }
  }, []);

  return { user, webApp };
} 
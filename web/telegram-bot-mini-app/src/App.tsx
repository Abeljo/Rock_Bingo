import React, { useEffect, useState } from 'react';
import { useTelegram } from './hooks/useTelegram';
import GameRoomFlow from './components/GameRoomFlow';

interface ApiUser {
  id: number;
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
}

function App() {
  const { user, webApp } = useTelegram();
  const [apiUser, setApiUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Register/authenticate user with backend when Telegram user is present
  useEffect(() => {
    if (user) {
      setLoading(true);
      fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000'}/api/auth/telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: user.id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          setApiUser(data);
          setLoading(false);
        })
        .catch((err) => {
          setError('Failed to authenticate with backend.');
          setLoading(false);
        });
    }
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col bg-brand-cyan text-brand-white">
      <header className="w-full py-4 px-6 bg-brand-orange flex items-center justify-between shadow-md">
        <h1 className="text-xl font-bold tracking-wide">Rock Bingo</h1>
        {/* Telegram Mini App context/controls will go here */}
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {!webApp && (
          <div className="w-full max-w-md bg-brand-white/10 rounded-lg shadow-lg p-6 flex flex-col items-center">
            <h2 className="text-2xl font-semibold mb-4 text-brand-orange">Not in Telegram</h2>
            <p className="mb-2 text-center">Please open this app from Telegram to play Rock Bingo.</p>
          </div>
        )}
        {webApp && !user && (
          <div className="w-full max-w-md bg-brand-white/10 rounded-lg shadow-lg p-6 flex flex-col items-center">
            <h2 className="text-2xl font-semibold mb-4 text-brand-orange">Loading Telegram...</h2>
          </div>
        )}
        {webApp && user && (
          <div className="w-full max-w-md bg-brand-white/10 rounded-lg shadow-lg p-6 flex flex-col items-center">
            <h2 className="text-2xl font-semibold mb-2 text-brand-orange">Welcome, {user.first_name}!</h2>
            {user.photo_url && (
              <img src={user.photo_url} alt="avatar" className="w-16 h-16 rounded-full mb-2 border-2 border-brand-orange" />
            )}
            <p className="mb-2 text-center text-brand-white/80">@{user.username}</p>
            {loading && <p className="text-brand-orange">Authenticating...</p>}
            {error && <p className="text-red-400">{error}</p>}
            {apiUser && (
              <div className="mt-4 w-full">
                {/* Main game flow will be rendered here next */}
                <GameRoomFlow apiUser={apiUser} betAmount={10} />
              </div>
            )}
          </div>
        )}
      </main>
      <footer className="w-full py-2 text-center text-xs text-brand-white/70 bg-brand-cyan">
        &copy; {new Date().getFullYear()} Rock Bingo
      </footer>
    </div>
  );
}

export default App; 
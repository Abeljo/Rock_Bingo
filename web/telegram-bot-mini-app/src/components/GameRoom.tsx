import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Users, Timer, Sparkles, ArrowLeft } from 'lucide-react';
import { BingoCard } from './BingoCard';
import { NumberCaller } from './NumberCaller';
import { Room, BingoCard as BingoCardType, GameSession, Player, User } from '../types';
import { apiService } from '../services/api';
import { useTelegram } from '../hooks/useTelegram';

interface GameRoomProps {
  room: Room;
  onBack: () => void;
}

export function GameRoom({ room, onBack }: GameRoomProps) {
  const { user: telegramUser } = useTelegram();
  const [user, setUser] = useState<User | null>(null);
  const [card, setCard] = useState<BingoCardType | null>(null);
  const [session, setSession] = useState<GameSession | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameTime, setGameTime] = useState(0);
  const [winner, setWinner] = useState<Player | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Authenticate and set user
  useEffect(() => {
    if (telegramUser) {
      apiService.authenticateTelegram({
        telegram_id: telegramUser.id,
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
      }).then(setUser).catch(() => setUser(null));
    }
  }, [telegramUser]);

  // Main game data loader
  const loadGameData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Join the room
      await apiService.joinRoom(room.id, user.id);

      // 2. Get all cards in the room
      const allCards = await apiService.getRoomCards(room.id);
      console.log('All cards in room:', allCards);
      
      // 3. Find user's card or create one
      let myCard = null;
      if (allCards && Array.isArray(allCards)) {
        myCard = allCards.find((c: any) => c.user_id === user.id);
      }
      console.log('My card found:', myCard);
      
      if (!myCard) {
        console.log('Creating new card for user');
        myCard = await apiService.createCard(room.id, user.id);
        console.log('New card created:', myCard);
      }
      setCard(myCard);

      // 4. Get or create session for the room
      let gameSession = null;
      try {
        gameSession = await apiService.getSession(room.id);
      } catch {
        // If not found, do not create session yet (let host start it)
        gameSession = null;
      }
      setSession(gameSession);

      // 5. Get players
      const playersData = await apiService.getRoomPlayers(room.id);
      setPlayers(playersData);

      // 6. Get winners if session exists
      if (gameSession) {
        const winners = await apiService.getWinners(gameSession.id);
        if (winners && winners.length > 0) {
          setWinner(winners.find((w: any) => w.user_id === user.id) || null);
        } else {
          setWinner(null);
        }
      } else {
        setWinner(null);
      }
    } catch (err: any) {
      setError('Failed to load game data: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  }, [room.id, user]);

  // Initial load
  useEffect(() => {
    loadGameData();
    // eslint-disable-next-line
  }, [user, room.id]);

  // Poll session and players for updates
  useEffect(() => {
    if (!session) return;
    const timer = setInterval(() => {
      setGameTime((prev) => prev + 5);
      apiService.getSession(session.id).then(setSession).catch(() => {});
      apiService.getRoomPlayers(room.id).then(setPlayers).catch(() => {});
      apiService.getWinners(session.id).then(winners => {
        if (winners && winners.length > 0) {
          setWinner(winners.find((w: any) => w.user_id === user?.id) || null);
        } else {
          setWinner(null);
        }
      }).catch(() => {});
    }, 5000);
    return () => clearInterval(timer);
  }, [session, room.id, user?.id]);

  // Game actions
  const handleMarkNumber = async (number: number) => {
    if (!session || !card || !user) return;
    try {
      await apiService.markNumber(session.id, card.id, number, user.id);
      setActionMessage('Number marked!');
      setTimeout(() => setActionMessage(null), 1500);
      loadGameData();
    } catch (error) {
      setError('Failed to mark number.');
    }
  };

  const handleDrawNumber = async () => {
    if (!session || !user) return;
    try {
      await apiService.drawNumber(session.id, user.id);
      setActionMessage('Number drawn!');
      setTimeout(() => setActionMessage(null), 1500);
      loadGameData();
    } catch (error) {
      setError('Failed to draw number.');
    }
  };

  const handleClaimBingo = async () => {
    if (!session || !card || !user) return;
    try {
      await apiService.claimBingo(session.id, card.id, user.id);
      setActionMessage('Bingo claimed! Waiting for validation...');
      setTimeout(() => setActionMessage(null), 2000);
      loadGameData();
    } catch (error) {
      setError('Failed to claim bingo.');
    }
  };

  const handleStartGame = async () => {
    if (!room || !user) return;
    try {
      const newSession = await apiService.createSession(room.id, user.id);
      setSession(newSession);
      setActionMessage('Game started!');
      setTimeout(() => setActionMessage(null), 1500);
      loadGameData();
    } catch (error) {
      setError('Failed to start game.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine game phase
  let gamePhase: 'waiting' | 'ready' | 'active' | 'finished' = 'waiting';
  if (session) {
    if (session.status === 'completed') gamePhase = 'finished';
    else if (session.status === 'active') gamePhase = 'active';
    else gamePhase = 'ready';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 font-bold">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold">{`Room #${room.id}`}</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Users className="h-5 w-5" />
            <span>{players.length}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Trophy className="h-5 w-5" />
            <span>{room.entry_fee ?? room.bet_amount} ETB</span>
          </div>
          <div className="flex items-center space-x-1">
            <Timer className="h-5 w-5" />
            <span>{formatTime(gameTime)}</span>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-4">
        {/* Status and winner banners */}
        {actionMessage && (
          <div className="mb-4 text-center text-blue-600 font-semibold animate-pulse">{actionMessage}</div>
        )}
        {winner && (
          <div className="mb-4 flex items-center justify-center text-green-700 font-bold text-xl bg-green-100 rounded-lg p-4 shadow animate-bounce">
            <Sparkles className="h-6 w-6 mr-2 text-yellow-500" />
            Congratulations! You are a winner!
          </div>
        )}
        {gamePhase === 'waiting' && (
          <div className="mb-4 text-center text-gray-700 font-semibold">
            Waiting for players to join...<br />
            Share the room link to invite friends!
          </div>
        )}
        {gamePhase === 'ready' && (
          <div className="mb-4 text-center text-purple-700 font-semibold">
            Game is ready to start.<br />
            {players.length > 0 && user && players[0].user_id === user.id && (
              <button
                onClick={handleStartGame}
                className="mt-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-bold shadow hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
              >
                Start Game
              </button>
            )}
            {players.length > 0 && user && players[0].user_id !== user.id && (
              <span>Waiting for host to start the game...</span>
            )}
          </div>
        )}
        {gamePhase === 'active' && (
          <div className="mb-4 text-center text-green-700 font-semibold">
            Game in progress!
          </div>
        )}
        {gamePhase === 'finished' && (
          <div className="mb-4 text-center text-gray-700 font-semibold">
            Game finished. {winner ? 'You won!' : 'Better luck next time!'}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {card && session && (
              <BingoCard 
                card={card} 
                onMarkNumber={handleMarkNumber} 
                drawnNumbers={session.drawn_numbers || session.called_numbers || []} 
              />
            )}
            {card && (
              <div className="mt-2 text-center text-gray-600 text-sm">Your Card ID: <span className="font-mono">{card.id}</span></div>
            )}
          </div>
          <div className="space-y-4">
            {session && (
              <NumberCaller 
                currentNumber={(session.drawn_numbers || session.called_numbers || [])[((session.drawn_numbers || session.called_numbers || []).length - 1)]} 
                calledNumbers={session.drawn_numbers || session.called_numbers || []} 
                onDrawNumber={handleDrawNumber}
                isGameActive={session.status === 'active'}
              />
            )}
            <button
              onClick={handleClaimBingo}
              disabled={!session || session.status !== 'active'}
              className="w-full py-3 px-4 bg-green-500 text-white font-bold rounded-lg shadow-md hover:bg-green-600 disabled:bg-gray-400"
            >
              Claim Bingo
            </button>
            <div>
              <h3 className="font-bold mb-2">Players</h3>
              <ul className="bg-white p-2 rounded-lg shadow-inner">
                {players.map(p => <li key={p.id}>{p.first_name}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

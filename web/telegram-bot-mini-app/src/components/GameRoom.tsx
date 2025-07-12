import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Users, Timer, Sparkles, ArrowLeft, Play, Check } from 'lucide-react';
import { BingoCard } from './BingoCard';
import { CardSelection } from './CardSelection';
import { Countdown } from './Countdown';
import { Room, GameSession, Player, User } from '../types';
import { apiService } from '../services/api';
import { useTelegram } from '../hooks/useTelegram';

interface GameRoomProps {
  room: Room;
  onBack: () => void;
}

export function GameRoom({ room, onBack }: GameRoomProps) {
  const { user: telegramUser } = useTelegram();
  const [user, setUser] = useState<User | null>(null);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [session, setSession] = useState<GameSession | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameTime, setGameTime] = useState(0);
  const [winner, setWinner] = useState<Player | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [showCardSelection, setShowCardSelection] = useState(false);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [countdown, setCountdown] = useState<any>(null);

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

      // 2. Check if user has selected a card
      const myCard = await apiService.getMyCard(room.id, user.id);
      if (myCard) {
        setSelectedCard(myCard);
      } else {
        // No card selected yet, show card selection
        setShowCardSelection(true);
        setLoading(false);
        return;
      }

      // 3. Get or create session for the room
      let gameSession = await apiService.getRoomSession(room.id);
      if (gameSession && gameSession.drawn_numbers) {
        setDrawnNumbers(gameSession.drawn_numbers);
      }
      setSession(gameSession);

      // 4. Get players
      const playersData = await apiService.getRoomPlayers(room.id);
      setPlayers(playersData);

      // 5. Get countdown information
      try {
        const countdownData = await apiService.getRoomCountdown(room.id);
        console.log('Countdown data:', countdownData);
        setCountdown(countdownData);
      } catch (err) {
        console.log('Countdown error:', err);
        setCountdown(null);
      }

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

  // Poll session, players, and countdown for updates
  useEffect(() => {
    const timer = setInterval(() => {
      if (session) {
        setGameTime((prev) => prev + 5);
        apiService.getSession(session.id).then(setSession).catch(() => {});
        apiService.getWinners(session.id).then(winners => {
          if (winners && winners.length > 0) {
            setWinner(winners.find((w: any) => w.user_id === user?.id) || null);
          } else {
            setWinner(null);
          }
        }).catch(() => {});
      }
      
      // Always poll countdown and players
      apiService.getRoomCountdown(room.id).then(setCountdown).catch(() => {});
      apiService.getRoomPlayers(room.id).then(setPlayers).catch(() => {});
    }, 5000);
    return () => clearInterval(timer);
  }, [session, room.id, user?.id]);

  // Game actions
  const handleMarkNumber = async (row: number, col: number, number: number) => {
    if (!session || !selectedCard || !user) return;
    try {
      await apiService.markNumber(session.id, selectedCard.card_number, number, user.id);
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
      const result = await apiService.drawNumber(session.id, user.id);
      setDrawnNumbers(prev => [...prev, result.number]);
      setActionMessage(`Number ${result.number} drawn!`);
      setTimeout(() => setActionMessage(null), 1500);
      loadGameData();
    } catch (error) {
      setError('Failed to draw number.');
    }
  };

  const handleClaimBingo = async () => {
    if (!session || !selectedCard || !user) return;
    try {
      await apiService.claimBingo(session.id, selectedCard.card_number, user.id);
      setActionMessage('Bingo claimed! Waiting for validation...');
      setTimeout(() => setActionMessage(null), 2000);
      loadGameData();
    } catch (error) {
      setError('Failed to claim bingo.');
    }
  };

  const handleStartGame = async () => {
    if (!room || !user) return;
    console.log('handleStartGame called', { roomId: room.id, userId: user.id });
    try {
      const newSession = await apiService.createSession(room.id, user.id);
      console.log('Session created:', newSession);
      setSession(newSession);
      setActionMessage('Game started!');
      setTimeout(() => setActionMessage(null), 1500);
      loadGameData();
    } catch (error) {
      console.error('Failed to start game:', error);
      setError('Failed to start game.');
    }
  };

  const handleCardSelected = (cardNumber: number) => {
    setShowCardSelection(false);
    loadGameData();
  };

  const handleGameStart = () => {
    // When countdown reaches zero, automatically start the game
    console.log('handleGameStart called', { session, countdown });
    if (!session) {
      console.log('Starting game automatically - countdown finished');
      handleStartGame();
    } else {
      console.log('Not starting game - session already exists:', { hasSession: !!session, timeLeft: countdown?.time_left });
    }
  };

  // Auto-draw numbers when game is active
  useEffect(() => {
    if (!session || session.status !== 'active') {
      console.log('Auto-draw not active:', { session: !!session, status: session?.status });
      return;
    }

    console.log('Starting auto-draw polling for session:', session.id);
    const autoDrawInterval = setInterval(async () => {
      try {
        console.log('Auto-drawing number for session:', session.id);
        const result = await apiService.autoDrawNumber(session.id);
        console.log('Auto-draw result:', result);
        setDrawnNumbers(prev => [...prev, result.number]);
        setActionMessage(`Number ${result.number} called automatically!`);
        setTimeout(() => setActionMessage(null), 2000);
      } catch (error) {
        console.error('Auto-draw failed:', error);
      }
    }, 5000); // Draw a number every 5 seconds

    return () => {
      console.log('Clearing auto-draw interval');
      clearInterval(autoDrawInterval);
    };
  }, [session]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine game phase
  let gamePhase: 'waiting' | 'countdown' | 'ready' | 'active' | 'finished' = 'waiting';
  if (session) {
    if (session.status === 'completed') gamePhase = 'finished';
    else if (session.status === 'active') gamePhase = 'active';
    else gamePhase = 'ready';
  } else if (countdown?.is_active) {
    gamePhase = 'countdown';
  }

  if (showCardSelection) {
    return (
      <CardSelection
        roomId={room.id}
        userId={user?.id || ''}
        onCardSelected={handleCardSelected}
        onBack={onBack}
      />
    );
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
      {/* Countdown Component */}
      {countdown && (
        <>
          <div className="fixed top-16 left-4 z-50 bg-white p-2 rounded text-xs">
            Debug: {JSON.stringify(countdown)}
          </div>
          <Countdown
            timeLeft={countdown.time_left}
            isActive={countdown.is_active}
            onGameStart={handleGameStart}
          />
        </>
      )}
      
      <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold">{`Room #${room.id}`}</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Users className="h-5 w-5" />
            <span>{(players || []).length}</span>
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
        {gamePhase === 'countdown' && (
          <div className="mb-4 text-center text-blue-700 font-semibold">
            Countdown started! Select your card quickly!<br />
            Game will start automatically in {countdown?.time_left || 0} seconds
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
            {selectedCard && (
              <BingoCard 
                cardData={selectedCard.card_data}
                cardNumber={selectedCard.card_number}
                onNumberClick={handleMarkNumber}
                disabled={!session || session.status !== 'active'}
              />
            )}
            {selectedCard && (
              <div className="mt-2 text-center text-gray-600 text-sm">
                Your Card: #{selectedCard.card_number}
              </div>
            )}
          </div>
          <div className="space-y-4">
            {/* Drawn Numbers Display */}
            {session && session.status === 'active' && (
              <div className="bg-white rounded-lg p-4 shadow">
                <h3 className="font-bold mb-3 text-center">Drawn Numbers</h3>
                <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto">
                  {(drawnNumbers || []).map((number, index) => (
                    <div
                      key={index}
                      className="bg-blue-100 text-blue-800 text-center py-2 rounded font-bold"
                    >
                      {number}
                    </div>
                  ))}
                </div>
                {(drawnNumbers || []).length === 0 && (
                  <p className="text-gray-500 text-center text-sm">No numbers drawn yet</p>
                )}
              </div>
            )}

            {/* Game Controls */}
            {session && session.status === 'active' && (
              <div className="space-y-3">
                <button
                  onClick={handleDrawNumber}
                  className="w-full py-3 px-4 bg-purple-500 text-white font-bold rounded-lg shadow-md hover:bg-purple-600 transition-colors"
                >
                  <Play className="h-5 w-5 inline mr-2" />
                  Draw Number
                </button>
                <button
                  onClick={handleClaimBingo}
                  className="w-full py-3 px-4 bg-green-500 text-white font-bold rounded-lg shadow-md hover:bg-green-600 transition-colors"
                >
                  <Check className="h-5 w-5 inline mr-2" />
                  Claim Bingo
                </button>
              </div>
            )}

            {/* Players List */}
            <div className="bg-white rounded-lg p-4 shadow">
              <h3 className="font-bold mb-3">Players ({(players || []).length})</h3>
              <ul className="space-y-2">
                {(players || []).map(player => (
                  <li key={player.id} className="flex items-center justify-between">
                    <span className="text-gray-700">{player.first_name}</span>
                    {player.user_id === user?.id && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">You</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

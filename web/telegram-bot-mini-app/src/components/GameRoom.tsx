import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Users, Timer, Sparkles, ArrowLeft, Play, Check, X } from 'lucide-react';
import { BingoCard } from './BingoCard';
import { CardSelection } from './CardSelection';
import { Countdown } from './Countdown';
import { Room, GameSession, Player, User } from '../types';
import { apiService } from '../services/api';
import { useTelegram } from '../hooks/useTelegram';
// import { useNavigate } from 'react-router-dom';

interface GameRoomProps {
  room: Room;
  onBack: () => void;
}

// Add confetti effect for win
function ConfettiCelebration({ show }: { show: boolean }) {
  if (!show) return null;
  // Simple emoji confetti fallback
  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center animate-fade-in">
      <div className="text-6xl select-none" aria-hidden="true" style={{ pointerEvents: 'none' }}>
        🎉🎊✨🎉🎊✨
      </div>
    </div>
  );
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
  const [uncalledModalOpen, setUncalledModalOpen] = useState(false);
  const [uncalledModalMsg, setUncalledModalMsg] = useState('');
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [winningAmount, setWinningAmount] = useState<number | null>(null);
  const [disabledCardNumbers, setDisabledCardNumbers] = useState<number[]>([]);
  const [forceCardSelection, setForceCardSelection] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  // const navigate = typeof useNavigate === 'function' ? useNavigate() : null;

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
      apiService.getRoomCountdown(room.id).then(data => {
        setCountdown(data);
        console.log('[GameRoom] Polled countdown:', data);
      }).catch(() => {});
      apiService.getRoomPlayers(room.id).then(setPlayers).catch(() => {});
    }, 5000);
    return () => clearInterval(timer);
  }, [session, room.id, user?.id]);

  // Game actions
  // 1. Optimistically update marks after marking a number
  const handleMarkNumber = async (row: number, col: number, number: number) => {
    if (!session || !selectedCard || !user) return;
    try {
      await apiService.markNumber(session.id, selectedCard.card_number, number, user.id);
      setActionMessage('Number marked!');
      setTimeout(() => setActionMessage(null), 1500);
      // Optimistically update marks
      setSelectedCard((prev: any) => {
        if (!prev) return prev;
        const cardData = typeof prev.card_data === 'string' ? JSON.parse(prev.card_data) : prev.card_data;
        const newMarks = cardData.marks.map((rowArr: boolean[], rIdx: number) =>
          rowArr.map((marked: boolean, cIdx: number) =>
            rIdx === row && cIdx === col ? true : marked
          )
        );
        return {
          ...prev,
          card_data: {
            ...cardData,
            marks: newMarks,
            grid: cardData.grid, // ensure grid is preserved
          },
        };
      });
      // Optionally, reload other game data except card
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
    
    // Check if card has a winning pattern before claiming
    if (!selectedCard.card_data) {
      setError('No card data available.');
      return;
    }

    // --- NEW: Check if all marked numbers are in drawn numbers ---
    const cardData = typeof selectedCard.card_data === 'string' ? JSON.parse(selectedCard.card_data) : selectedCard.card_data;
    if (!allMarkedNumbersAreCalled(cardData, drawnNumbers)) {
      setUncalledModalMsg('You have marked numbers that have not been called yet. Please only mark called numbers before claiming Bingo!');
      setUncalledModalOpen(true);
      setTimeout(() => setUncalledModalOpen(false), 3000);
      return;
    }
    // --- END NEW ---

    try {
      if (typeof cardData === 'object' && !hasWinningPattern(cardData)) {
        setError('No winning pattern found. You need a complete row, column, or diagonal to claim Bingo!');
        return;
      }
      
      await apiService.claimBingo(session.id, selectedCard.card_number, user.id);
      setActionMessage('Bingo claimed! Waiting for validation...');
      setTimeout(() => setActionMessage(null), 2000);
      loadGameData();
    } catch (error: any) {
      if (error.message && error.message.includes('winning bingo pattern')) {
        setError('No winning pattern found. You need a complete row, column, or diagonal to claim Bingo!');
      } else {
        setError('Failed to claim bingo.');
      }
    }
  };

  // Helper function to check for winning pattern
  const hasWinningPattern = (cardData: any) => {
    if (!cardData || !cardData.marks) return false;
    
    const marks = cardData.marks;
    
    // Check rows
    for (let i = 0; i < 5; i++) {
      let rowComplete = true;
      for (let j = 0; j < 5; j++) {
        if (!marks[i][j]) {
          rowComplete = false;
          break;
        }
      }
      if (rowComplete) return true;
    }
    
    // Check columns
    for (let j = 0; j < 5; j++) {
      let colComplete = true;
      for (let i = 0; i < 5; i++) {
        if (!marks[i][j]) {
          colComplete = false;
          break;
        }
      }
      if (colComplete) return true;
    }
    
    // Check diagonal (top-left to bottom-right)
    let diagComplete = true;
    for (let i = 0; i < 5; i++) {
      if (!marks[i][i]) {
        diagComplete = false;
        break;
      }
    }
    if (diagComplete) return true;
    
    // Check diagonal (top-right to bottom-left)
    diagComplete = true;
    for (let i = 0; i < 5; i++) {
      if (!marks[i][4-i]) {
        diagComplete = false;
        break;
      }
    }
    if (diagComplete) return true;
    
    return false;
  };

  // Helper function to check if all marked numbers are in drawn numbers
  const allMarkedNumbersAreCalled = (cardData: any, drawnNumbers: number[]) => {
    if (!cardData || !cardData.grid || !cardData.marks) return false;
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if (cardData.marks[i][j]) {
          const number = cardData.grid[i][j];
          if (!drawnNumbers.includes(number)) {
            return false;
          }
        }
      }
    }
    return true;
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

  // 2. After card selection, poll for countdown activation
  const pollCountdownAfterCardSelect = useCallback(() => {
    let attempts = 0;
    const maxAttempts = 10; // poll for up to 5 seconds
    const poll = async () => {
      attempts++;
      const countdownData = await apiService.getRoomCountdown(room.id);
      setCountdown(countdownData);
      if (countdownData && countdownData.is_active) {
        // Countdown is now active
        return;
      }
      if (attempts < maxAttempts) {
        setTimeout(poll, 500);
      }
    };
    poll();
  }, [room.id]);

  const handleCardSelected = (cardNumber: number) => {
    if (countdown && countdown.is_active) {
      loadGameData();
    } else {
      setShowCardSelection(false);
      setForceCardSelection(false);
      loadGameData();
      pollCountdownAfterCardSelect(); // start polling for countdown
    }
  };

  // Effect: when countdown ends and game becomes active, hide card selection
  useEffect(() => {
    if ((showCardSelection || forceCardSelection) && session && session.status === 'active') {
      setShowCardSelection(false);
      setForceCardSelection(false);
    }
  }, [session, showCardSelection, forceCardSelection]);

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
  }, [session?.id, session?.status]);

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

  // Show congrats modal and handle navigation after win
  useEffect(() => {
    if (gamePhase === 'finished' && winner) {
      setWinningAmount((winner as any)?.winnings || null);
      setShowCongratsModal(true);
      // Auto-close modal, reset state, and return to lobby after 2 seconds
      const timeout = setTimeout(() => {
        setShowCongratsModal(false);
        setSession(null);
        setSelectedCard(null);
        setShowCardSelection(false);
        setForceCardSelection(false);
        setDrawnNumbers([]);
        setCountdown(null);
        setWinner(null);
        setGameTime(0);
        onBack();
      }, 2000);
      return () => clearTimeout(timeout);
    }
    if (gamePhase === 'finished' && !winner) {
      setShowCongratsModal(false);
      setShowGameOverModal(true);
    }
  }, [gamePhase, winner, selectedCard]);

  // Optionally, play a sound on win
  useEffect(() => {
    if (showCongratsModal) {
      const audio = new Audio('https://cdn.pixabay.com/audio/2022/07/26/audio_124bfa4c8b.mp3');
      audio.play();
    }
  }, [showCongratsModal]);

  // Handler for Select Another Card
  const handleSelectAnotherCard = () => {
    setShowCongratsModal(false);
    if (selectedCard) {
      setDisabledCardNumbers((prev) => [...prev, selectedCard.card_number]);
    }
    setSelectedCard(null); // Clear selected card so CardSelection is shown
    setShowCardSelection(true);
    setForceCardSelection(true);
  };

  // Handler for Leave Room
  const handleLeaveRoom = () => {
    setShowCongratsModal(false);
    if (window.Telegram && window.Telegram.WebApp && typeof window.Telegram.WebApp.close === 'function') {
      window.Telegram.WebApp.close();
    } else {
      // fallback: reload or navigate away
      window.location.href = 'about:blank';
    }
  };

  // Add a leave room handler
  const handleLeaveRoomButton = async () => {
    if (!room || !user) return;
    try {
      await apiService.leaveRoom(room.id, user.id);
      if (window.Telegram && window.Telegram.WebApp && typeof window.Telegram.WebApp.close === 'function') {
        window.Telegram.WebApp.close();
      } else {
        onBack();
      }
    } catch (e) {
      setError('Failed to leave room.');
    }
  };

  // If all cards are selected, refresh and move to a new room
  useEffect(() => {
    if (showCardSelection && selectedCard && disabledCardNumbers.length >= 99) {
      // All cards selected, refresh or move to a new room
      window.location.reload(); // or trigger a new room join logic
    }
  }, [showCardSelection, disabledCardNumbers, selectedCard]);

  // Add a helper to get the latest called number
  const safeDrawnNumbers = Array.isArray(drawnNumbers) ? drawnNumbers : [];
  const safePlayers = Array.isArray(players) ? players : [];
  const latestNumber = safeDrawnNumbers.length > 0 ? safeDrawnNumbers[safeDrawnNumbers.length - 1] : null;
  const prizePool = (safePlayers.length * (room.bet_amount || 0)).toFixed(2);

  if ((showCardSelection || forceCardSelection) || (!selectedCard && session && session.status === 'active')) {
    return (
      <div>
        {/* Show countdown timer on card selection screen if countdown is active and game not started */}
        {countdown && countdown.is_active && (
          <Countdown
            timeLeft={countdown.time_left}
            isActive={countdown.is_active}
            onGameStart={handleGameStart}
          />
        )}
        {/* If game is in progress and user has no card, show indicator and disable card selection */}
        {session && session.status === 'active' && !selectedCard ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="text-yellow-500 mb-4">
                <svg className="h-16 w-16 mx-auto animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Game In Progress</h2>
              <p className="text-gray-600">You did not select a card in time. Please wait for the next game to join.</p>
            </div>
          </div>
        ) : (
          <>
            {console.log('[GameRoom] Passing countdown to CardSelection:', countdown)}
            <CardSelection
              roomId={room.id}
              userId={user?.id || ''}
              onCardSelected={handleCardSelected}
              onBack={onBack}
              disabledCardNumbers={disabledCardNumbers}
              countdown={countdown}
              selectedCard={selectedCard}
              onCountdownEnd={() => {
                setShowCardSelection(false);
                setForceCardSelection(false);
              }}
            />
          </>
        )}
      </div>
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full text-center animate-fade-in">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Game Room Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null);
              onBack();
            }}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Return to Lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Uncalled Numbers Toast */}
      {uncalledModalOpen && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl px-6 py-3 max-w-xs w-full text-center border border-red-200 animate-fade-in">
            <div className="text-red-600 font-semibold mb-1 flex items-center justify-center">
              <X className="h-5 w-5 mr-2" />
              {uncalledModalMsg}
            </div>
          </div>
        </div>
      )}

      {/* Congrats Modal */}
      {showCongratsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full text-center animate-fade-in">
            <Sparkles className="h-12 w-12 text-yellow-500 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold text-green-700 mb-2">Congratulations!</h2>
            <p className="text-lg text-gray-800 mb-2">You won the game!</p>
            {winningAmount !== null && (
              <p className="text-xl font-bold text-purple-700 mb-4">+{winningAmount.toFixed(2)} ETB</p>
            )}
            <div className="flex flex-col gap-3 mt-4">
              <button
                onClick={handleSelectAnotherCard}
                className="w-full px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-bold shadow hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
              >
                Select Another Card
              </button>
              <button
                onClick={handleLeaveRoom}
                className="w-full px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-bold shadow hover:bg-gray-300 transition-all duration-200"
              >
                Leave Room
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Game Over Modal */}
      {showGameOverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full text-center animate-fade-in">
            <X className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Game Over</h2>
            <p className="text-lg text-gray-800 mb-4">Better luck next time!</p>
            <button
              onClick={() => {
                setShowGameOverModal(false);
                onBack();
              }}
              className="w-full px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-bold shadow hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
            >
              Return to Lobby
            </button>
          </div>
        </div>
      )}
      {/* Countdown Component */}
      {countdown && (
        <>
          {/* <div className="fixed top-16 left-4 z-50 bg-white p-2 rounded text-xs">
            Debug: {JSON.stringify(countdown)}
          </div> */}
          <Countdown
            timeLeft={countdown.time_left}
            isActive={countdown.is_active}
            onGameStart={handleGameStart}
          />
        </>
      )}
      
      {/* Animated Countdown Overlay */}
      {gamePhase === 'countdown' && countdown && countdown.is_active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl px-12 py-10 text-center flex flex-col items-center">
            <div className="text-5xl font-extrabold text-purple-700 mb-4 animate-bounce">
              {countdown.time_left}
            </div>
            <div className="text-xl font-semibold text-gray-800 mb-2">Game starting soon!</div>
            <div className="text-gray-500">Get ready to play Bingo!</div>
          </div>
        </div>
      )}

      {/* Confetti Celebration */}
      <ConfettiCelebration show={showCongratsModal} />

      <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold">{`Room #${room.id}`}</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Users className="h-5 w-5" />
            <span>{safePlayers.length}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Trophy className="h-5 w-5" />
            <span>{room.bet_amount} ETB</span>
          </div>
          <div className="flex items-center space-x-1">
            <Timer className="h-5 w-5" />
            <span>{formatTime(gameTime)}</span>
          </div>
          {/* Leave Room Button */}
          <button
            onClick={handleLeaveRoomButton}
            className="ml-4 px-4 py-2 bg-red-500 text-white rounded-lg font-bold shadow hover:bg-red-600 transition-all duration-200"
          >
            Leave Room
          </button>
        </div>
      </div>

      {/* Player List and Prize Pool */}
      <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-500" />
          <span className="font-semibold text-gray-700">Players:</span>
          <div className="flex flex-wrap gap-1">
            {safePlayers.map(player => (
              <span
                key={player.id}
                className={`px-2 py-1 rounded text-xs font-bold ${player.id === user?.id ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                {player.first_name}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <span className="font-semibold text-gray-700">Prize Pool:</span>
          <span className="text-lg font-bold text-purple-700">{prizePool} ETB</span>
        </div>
      </div>

      {/* Move actionMessage above the card, reserve space to prevent shifting */}
      <main className="max-w-4xl mx-auto p-4">
        <div style={{ minHeight: '32px' }}>
          {actionMessage && (
            <div className="mb-2 text-center text-blue-600 font-semibold animate-pulse">{actionMessage}</div>
          )}
        </div>
        {/* Status and winner banners */}
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
            {safePlayers.length > 0 && user && safePlayers[0].id === user.id && (
              <button
                onClick={handleStartGame}
                className="mt-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-bold shadow hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
              >
                Start Game
              </button>
            )}
            {safePlayers.length > 0 && user && safePlayers[0].id !== user.id && (
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
            {selectedCard && selectedCard.card_data && (
              <BingoCard 
                cardData={selectedCard.card_data}
                cardNumber={selectedCard.card_number}
                onNumberClick={handleMarkNumber}
                disabled={!session || session.status !== 'active'}
              />
            )}
            {selectedCard && !selectedCard.card_data && (
              <div className="text-center text-red-500 font-semibold mt-4">
                Card data is missing or invalid. Please select another card.
              </div>
            )}
            {selectedCard && (
              <div className="mt-2 text-center text-gray-600 text-sm">
                Your Card: #{selectedCard.card_number}
              </div>
            )}
          </div>
          <div className="space-y-4">
            {/* Drawn Numbers Display with animation for latest */}
            {session && session.status === 'active' && (
              <div className="bg-white rounded-lg p-4 shadow">
                <h3 className="font-bold mb-3 text-center">Drawn Numbers</h3>
                <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto">
                  {safeDrawnNumbers.map((number, index) => (
                    <div
                      key={index}
                      className={`text-center py-2 rounded font-bold transition-all duration-300
                        ${number === latestNumber ? 'bg-yellow-300 text-yellow-900 scale-110 shadow-lg animate-bounce' : 'bg-blue-100 text-blue-800'}`}
                    >
                      {number}
                    </div>
                  ))}
                </div>
                {safeDrawnNumbers.length === 0 && (
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
              <h3 className="font-bold mb-3">Players ({safePlayers.length})</h3>
              <ul className="space-y-2">
                {safePlayers.map(player => (
                  <li key={player.id} className="flex items-center justify-between">
                    <span className="text-gray-700">{player.first_name}</span>
                    {player.id === user?.id && (
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

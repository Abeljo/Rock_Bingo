import React, { useState, useEffect, useCallback, useReducer } from 'react';
import { Trophy, Users, Timer, Sparkles, ArrowLeft, Play, Check, X } from 'lucide-react';
import { BingoCard } from './BingoCard';
import { CardSelection } from './CardSelection';
import { Countdown } from './Countdown';
import { Room, GameSession, Player, User, BingoCard as BingoCardType } from '../types';
import { apiService } from '../services/api';
import { useTelegram } from '../hooks/useTelegram';
import { GameRoomHeader } from './GameRoom/GameRoomHeader';
import { GameRoomStatusBanner } from './GameRoom/GameRoomStatusBanner';
import { GameRoomModals } from './GameRoom/GameRoomModals';
import { GameRoomDrawnNumbers } from './GameRoom/GameRoomDrawnNumbers';
import { GameRoomPlayerList } from './GameRoom/GameRoomPlayerList';
import { GameRoomPrizePool } from './GameRoom/GameRoomPrizePool';
import { GameRoomControls } from './GameRoom/GameRoomControls';
import { GameRoomCardSection } from './GameRoom/GameRoomCardSection';
import { GameRoomCardSelectionWrapper } from './GameRoom/GameRoomCardSelectionWrapper';

// Types for state and actions
interface GameRoomState {
  user: User | null;
  selectedCard: BingoCardType | null;
  session: GameSession | null;
  players: Player[];
  loading: boolean;
  error: string | null;
  gameTime: number;
  winner: any;
  actionMessage: string | null;
  showCardSelection: boolean;
  drawnNumbers: number[];
  countdown: any;
  uncalledModalOpen: boolean;
  uncalledModalMsg: string;
  showCongratsModal: boolean;
  winningAmount: number | null;
  disabledCardNumbers: number[];
  forceCardSelection: boolean;
  showGameOverModal: boolean;
}

type GameRoomAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_GAME_DATA'; payload: Partial<GameRoomState> }
  | { type: 'SET_ACTION_MESSAGE'; payload: string | null }
  | { type: 'SET_SHOW_CARD_SELECTION'; payload: boolean }
  | { type: 'SET_SELECTED_CARD'; payload: BingoCardType | null }
  | { type: 'SET_SESSION'; payload: GameSession | null }
  | { type: 'SET_DRAWN_NUMBERS'; payload: number[] }
  | { type: 'SET_COUNTDOWN'; payload: any }
  | { type: 'SET_WINNER'; payload: any }
  | { type: 'SHOW_UNSUPPORTED_BINGO_CLAIM'; payload: string }
  | { type: 'HIDE_UNSUPPORTED_BINGO_CLAIM' }
  | { type: 'SHOW_CONGRATS_MODAL'; payload: number | null }
  | { type: 'HIDE_CONGRATS_MODAL' }
  | { type: 'SHOW_GAME_OVER_MODAL' }
  | { type: 'HIDE_GAME_OVER_MODAL' }
  | { type: 'RESET_GAME' };

// Initial state definition
const initialState: GameRoomState = {
  user: null,
  selectedCard: null,
  session: null,
  players: [],
  loading: false,
  error: null,
  gameTime: 0,
  winner: null,
  actionMessage: null,
  showCardSelection: false,
  drawnNumbers: [],
  countdown: null,
  uncalledModalOpen: false,
  uncalledModalMsg: '',
  showCongratsModal: false,
  winningAmount: null,
  disabledCardNumbers: [],
  forceCardSelection: false,
  showGameOverModal: false,
};

// Reducer for state management
function gameRoomReducer(state: GameRoomState, action: GameRoomAction): GameRoomState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_GAME_DATA':
      return { ...state, ...action.payload };
    case 'SET_ACTION_MESSAGE':
      return { ...state, actionMessage: action.payload };
    case 'SET_SHOW_CARD_SELECTION':
      return { ...state, showCardSelection: action.payload };
    case 'SET_SELECTED_CARD':
      return { ...state, selectedCard: action.payload };
    case 'SET_SESSION':
      return { ...state, session: action.payload };
    case 'SET_DRAWN_NUMBERS':
      return { ...state, drawnNumbers: action.payload };
    case 'SET_COUNTDOWN':
      return { ...state, countdown: action.payload };
    case 'SET_WINNER':
      return { ...state, winner: action.payload };
    case 'SHOW_UNSUPPORTED_BINGO_CLAIM':
      return { ...state, uncalledModalOpen: true, uncalledModalMsg: action.payload };
    case 'HIDE_UNSUPPORTED_BINGO_CLAIM':
      return { ...state, uncalledModalOpen: false, uncalledModalMsg: '' };
    case 'SHOW_CONGRATS_MODAL':
      return { ...state, showCongratsModal: true, winningAmount: action.payload };
    case 'HIDE_CONGRATS_MODAL':
      return { ...state, showCongratsModal: false };
    case 'SHOW_GAME_OVER_MODAL':
      return { ...state, showGameOverModal: true };
    case 'HIDE_GAME_OVER_MODAL':
      return { ...state, showGameOverModal: false };
    case 'RESET_GAME':
      return { ...initialState, user: state.user };
    default:
      return state;
  }
}

interface GameRoomProps {
  room: Room;
  onBack: () => void;
}

export function GameRoom({ room, onBack }: GameRoomProps) {
  const { user: telegramUser } = useTelegram();
  const [state, dispatch] = useReducer(gameRoomReducer, initialState);

  const {
    user,
    selectedCard,
    session,
    players,
    loading,
    error,
    gameTime,
    winner,
    actionMessage,
    showCardSelection,
    drawnNumbers,
    countdown,
    uncalledModalOpen,
    uncalledModalMsg,
    showCongratsModal,
    winningAmount,
    disabledCardNumbers,
    forceCardSelection,
    showGameOverModal,
  } = state;

  // Authenticate user on telegramUser change
  useEffect(() => {
    if (!telegramUser) return;
    apiService.authenticateTelegram({
      telegram_id: telegramUser.id,
      username: telegramUser.username,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
    }).then((user: User) => {
      dispatch({ type: 'SET_USER', payload: user });
      apiService.setAuthUser(user);
    }).catch(() => dispatch({ type: 'SET_USER', payload: null }));
  }, [telegramUser]);

  // Load game data
  const loadGameData = useCallback(async () => {
    if (!user) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      await apiService.joinRoom(room.id);

      const myCard = await apiService.getMyCard(room.id);
      if (myCard) {
        dispatch({ type: 'SET_SELECTED_CARD', payload: myCard });
      } else {
        dispatch({ type: 'SET_SHOW_CARD_SELECTION', payload: true });
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      const gameSession = await apiService.getRoomSession(room.id);
      if (gameSession?.drawn_numbers) {
        dispatch({ type: 'SET_DRAWN_NUMBERS', payload: gameSession.drawn_numbers });
      }
      dispatch({ type: 'SET_SESSION', payload: gameSession });

      const playersData = await apiService.getRoomPlayers(room.id);
      dispatch({ type: 'SET_GAME_DATA', payload: { players: playersData } });

      try {
        const countdownData = await apiService.getRoomCountdown(room.id);
        dispatch({ type: 'SET_COUNTDOWN', payload: countdownData });
      } catch {
        dispatch({ type: 'SET_COUNTDOWN', payload: null });
      }

      if (gameSession) {
        const winners = await apiService.getWinners(gameSession.id);
        dispatch({ type: 'SET_WINNER', payload: winners?.find((w: any) => w.user_id === user.id) ?? null });
      } else {
        dispatch({ type: 'SET_WINNER', payload: null });
      }
    } catch (err) {
      let msg = 'Failed to load game data';
      if (err && typeof err === 'object' && err !== null && 'message' in err) {
        msg += ': ' + (err as any).message;
      }
      dispatch({ type: 'SET_ERROR', payload: msg });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [room.id, user]);

  useEffect(() => {
    loadGameData();
  }, [loadGameData]);

  // Poll for countdown, session, players
  useEffect(() => {
    if (!user) return;
    let polling = true;

    const poll = async () => {
      try {
        const countdownData = await apiService.getRoomCountdown(room.id);
        dispatch({ type: 'SET_COUNTDOWN', payload: countdownData });

        const gameSession = await apiService.getRoomSession(room.id);
        dispatch({ type: 'SET_SESSION', payload: gameSession });
        if (gameSession?.drawn_numbers) {
          dispatch({ type: 'SET_DRAWN_NUMBERS', payload: gameSession.drawn_numbers });
        }

        const playersData = await apiService.getRoomPlayers(room.id);
        dispatch({ type: 'SET_GAME_DATA', payload: { players: playersData } });

        if (countdownData?.time_left <= 0 && (!gameSession || gameSession.status !== 'active')) {
          try {
            await apiService.createSession(room.id);
            const newSession = await apiService.getRoomSession(room.id);
            dispatch({ type: 'SET_SESSION', payload: newSession });
            if (newSession?.drawn_numbers) {
              dispatch({ type: 'SET_DRAWN_NUMBERS', payload: newSession.drawn_numbers });
            }
          } catch {
            // ignore if session exists
          }
        }
      } catch {
        // optionally handle poll errors
      }

      if (polling) setTimeout(poll, 1000);
    };

    poll();
    return () => { polling = false; };
  }, [room.id, user]);

  // Handlers: mark number, draw number, claim bingo
  const handleMarkNumber = (number: number) => {
    if (!session || !selectedCard || !user) return;
    apiService.markNumber(session.id, Number(selectedCard.id), number)
      .then(() => {
        dispatch({ type: 'SET_ACTION_MESSAGE', payload: 'Number marked!' });
        setTimeout(() => dispatch({ type: 'SET_ACTION_MESSAGE', payload: null }), 1500);
        return apiService.getMyCard(room.id);
      })
      .then((updatedCard: BingoCardType) => {
        if (updatedCard) dispatch({ type: 'SET_SELECTED_CARD', payload: updatedCard });
        loadGameData();
      })
      .catch(() => {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to mark number.' });
      });
  };

  const handleDrawNumber = async () => {
    if (!session || !user) return;
    try {
      const result = await apiService.drawNumber(session.id);
      dispatch({ type: 'SET_DRAWN_NUMBERS', payload: [...drawnNumbers, result.number] });
      dispatch({ type: 'SET_ACTION_MESSAGE', payload: `Number ${result.number} drawn!` });
      setTimeout(() => dispatch({ type: 'SET_ACTION_MESSAGE', payload: null }), 1500);
      loadGameData();
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to draw number.' });
    }
  };

  const handleClaimBingo = async () => {
    if (!session || !selectedCard || !user) return;
    try {
      await apiService.claimBingo(session.id, Number(selectedCard.id));
      dispatch({ type: 'SET_ACTION_MESSAGE', payload: 'Bingo claimed! Waiting for validation...' });
      setTimeout(() => dispatch({ type: 'SET_ACTION_MESSAGE', payload: null }), 2000);
      loadGameData();
    } catch (error) {
      let msg = 'Failed to claim bingo.';
      if (error && typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string') {
        if ((error as any).message.includes('winning bingo pattern')) {
          msg = 'No winning pattern found. You need a complete row, column, or diagonal to claim Bingo!';
        }
      }
      dispatch({ type: 'SET_ERROR', payload: msg });
    }
  };

  const handleStartGame = async () => {
    if (!room || !user) return;
    try {
      const newSession = await apiService.createSession(room.id);
      dispatch({ type: 'SET_SESSION', payload: newSession });
      dispatch({ type: 'SET_ACTION_MESSAGE', payload: 'Game started!' });
      setTimeout(() => dispatch({ type: 'SET_ACTION_MESSAGE', payload: null }), 1500);
      loadGameData();
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to start game.' });
    }
  };

  // Poll countdown after card selection
  const pollCountdownAfterCardSelect = useCallback(() => {
    let attempts = 0;
    const maxAttempts = 10; // ~5 seconds
    const poll = async () => {
      attempts++;
      const countdownData = await apiService.getRoomCountdown(room.id);
      dispatch({ type: 'SET_COUNTDOWN', payload: countdownData });
      if (countdownData?.is_active) return;
      if (attempts < maxAttempts) setTimeout(poll, 500);
    };
    poll();
  }, [room.id]);

  // When a card is selected
  const handleCardSelected = async (cardNumber: number) => {
    if (user) {
      const cardData = await apiService.getMyCard(room.id);
      if (cardData) dispatch({ type: 'SET_SELECTED_CARD', payload: cardData });
    }
    if (countdown?.is_active) {
      loadGameData();
    } else {
      dispatch({ type: 'SET_SHOW_CARD_SELECTION', payload: false });
      loadGameData();
      pollCountdownAfterCardSelect();
    }
  };

  // Hide card selection when session active
  useEffect(() => {
    if ((showCardSelection || forceCardSelection) && session?.status === 'active') {
      dispatch({ type: 'SET_SHOW_CARD_SELECTION', payload: false });
    }
  }, [session, showCardSelection, forceCardSelection]);

  // Auto-draw numbers every 5 seconds during active game
  useEffect(() => {
    if (!session || session.status !== 'active') return;

    const interval = setInterval(async () => {
      try {
        const result = await apiService.autoDrawNumber(session.id);
        dispatch({ type: 'SET_DRAWN_NUMBERS', payload: [...drawnNumbers, result.number] });
        dispatch({ type: 'SET_ACTION_MESSAGE', payload: `Number ${result.number} called automatically!` });
        setTimeout(() => dispatch({ type: 'SET_ACTION_MESSAGE', payload: null }), 2000);
      } catch {
        // ignore errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [session?.id, session?.status, drawnNumbers]);

  // Determine game phase
  type GamePhase = 'waiting' | 'finished' | 'active' | 'ready' | 'countdown';
  let gamePhase: GamePhase = 'waiting';
  if (session) {
    if (session.status === 'completed') gamePhase = 'finished';
    else if (session.status === 'active') gamePhase = 'active';
    else gamePhase = 'ready';
  } else if (countdown?.is_active) {
    gamePhase = 'countdown';
  }

  // Congratulation modal and game over modal logic
  useEffect(() => {
    if (gamePhase === 'finished' && winner) {
      dispatch({ type: 'SHOW_CONGRATS_MODAL', payload: winner?.winnings ?? null });
      const timeout = setTimeout(() => {
        dispatch({ type: 'HIDE_CONGRATS_MODAL' });
        dispatch({ type: 'RESET_GAME' });
        onBack();
      }, 2000);
      return () => clearTimeout(timeout);
    }
    if (gamePhase === 'finished' && !winner) {
      dispatch({ type: 'SHOW_GAME_OVER_MODAL' });
    }
  }, [gamePhase, winner, onBack]);

  // Play sound on congrats modal show
  useEffect(() => {
    if (showCongratsModal) {
      const audio = new Audio('https://cdn.pixabay.com/audio/2022/07/26/audio_124bfa4c8b.mp3');
      audio.play();
    }
  }, [showCongratsModal]);

  // Select another card handler
  const handleSelectAnotherCard = () => {
    dispatch({ type: 'HIDE_CONGRATS_MODAL' });
    if (selectedCard) {
      dispatch({ type: 'SET_GAME_DATA', payload: { disabledCardNumbers: [...disabledCardNumbers, Number(selectedCard.id)] } });
    }
    dispatch({ type: 'SET_SELECTED_CARD', payload: null });
    dispatch({ type: 'SET_SHOW_CARD_SELECTION', payload: true });
  };

  // Leave room handler
  const handleLeaveRoom = () => {
    dispatch({ type: 'HIDE_CONGRATS_MODAL' });
    if (window.Telegram?.WebApp?.close) {
      window.Telegram.WebApp.close();
    } else {
      window.location.href = 'about:blank';
    }
  };

  // Leave room button handler (calls API and then closes or navigates)
  const handleLeaveRoomButton = async () => {
    if (!room || !user) return;
    try {
      await apiService.leaveRoom(room.id);
      if (window.Telegram?.WebApp?.close) {
        window.Telegram.WebApp.close();
      } else {
        onBack();
      }
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to leave room.' });
    }
  };

  // If all cards disabled (>= 99), reload (maybe consider better logic here)
  useEffect(() => {
    if (showCardSelection && selectedCard && disabledCardNumbers.length >= 99) {
      window.location.reload();
    }
  }, [showCardSelection, disabledCardNumbers, selectedCard]);

  // Safety for arrays and variables
  const safeDrawnNumbers = Array.isArray(drawnNumbers) ? drawnNumbers : [];
  const safePlayers = Array.isArray(players) ? players : [];
  const latestNumber = safeDrawnNumbers.length > 0 ? safeDrawnNumbers[safeDrawnNumbers.length - 1] : null;
  const prizePool = (safePlayers.length * (room.bet_amount || 0)).toFixed(2);

  // Render UI

  // Show card selection or "game in progress with no card" screen if needed
  if ((showCardSelection || forceCardSelection) || (!selectedCard && session?.status === 'active')) {
    return (
      <div>
        {/* Countdown at top */}
        {countdown && (
          <div className="w-full flex justify-center mb-4">
            <Countdown timeLeft={countdown.time_left} isActive={countdown.is_active} onGameStart={handleStartGame} />
          </div>
        )}

        {/* Game in progress but user no card */}
        {session?.status === 'active' && !selectedCard ? (
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
          <CardSelection
            roomId={room.id}
            onCardSelected={handleCardSelected}
            onCardSelectedWithData={(card: BingoCardType) => dispatch({ type: 'SET_SELECTED_CARD', payload: card })}
            onBack={onBack}
            disabledCardNumbers={disabledCardNumbers}
            countdown={countdown}
            selectedCard={selectedCard}
            onCountdownEnd={() => dispatch({ type: 'SET_SHOW_CARD_SELECTION', payload: false })}
            userId={user?.id ? user.id.toString() : ''}
          />
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Game Room Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => {
              dispatch({ type: 'SET_ERROR', payload: null });
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

  // Main game room UI
  return (
    <div className="min-h-screen bg-gray-100">
      <GameRoomModals
        uncalledModalOpen={uncalledModalOpen}
        uncalledModalMsg={uncalledModalMsg}
        showCongratsModal={showCongratsModal}
        winningAmount={winningAmount}
        handleSelectAnotherCard={handleSelectAnotherCard}
        handleLeaveRoom={handleLeaveRoom}
        showGameOverModal={showGameOverModal}
        setShowGameOverModal={(val: boolean) => dispatch({ type: val ? 'SHOW_GAME_OVER_MODAL' : 'HIDE_GAME_OVER_MODAL' })}
        onBack={onBack}
      />
      <GameRoomHeader
        room={room}
        user={user}
        players={players}
        gameTime={gameTime}
        onBack={onBack}
        handleLeaveRoomButton={handleLeaveRoomButton}
      />
      <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
        <div className="flex items-center gap-2">
          <GameRoomPrizePool players={players} room={room} />
        </div>
      </div>
      <main className="max-w-4xl mx-auto p-4">
        <div style={{ minHeight: 32 }}>
          {actionMessage && <div className="mb-2 text-center text-blue-600 font-semibold animate-pulse">{actionMessage}</div>}
        </div>
        <GameRoomStatusBanner
          gamePhase={gamePhase}
          winner={winner}
          user={user}
          players={players}
          countdown={countdown}
          handleStartGame={handleStartGame}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <GameRoomCardSection selectedCard={selectedCard} session={session} handleMarkNumber={handleMarkNumber} />
          </div>
          <div className="space-y-4">
            <GameRoomDrawnNumbers drawnNumbers={safeDrawnNumbers} latestNumber={latestNumber} />
            <GameRoomControls session={session} handleDrawNumber={handleDrawNumber} handleClaimBingo={handleClaimBingo} />
            <GameRoomPlayerList players={safePlayers} user={user} />
          </div>
        </div>
      </main>
      <GameRoomCardSelectionWrapper
        showCardSelection={showCardSelection}
        forceCardSelection={forceCardSelection}
        session={session}
        selectedCard={selectedCard}
        disabledCardNumbers={disabledCardNumbers}
        countdown={countdown}
        handleCardSelected={handleCardSelected}
        onBack={onBack}
        dispatch={dispatch}
        userId={user?.id ? Number(user.id) : 0}
      />
    </div>
  );
}

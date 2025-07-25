
import { Sparkles } from 'lucide-react';

interface User {
  id: number | string;
}

interface Player {
  id: number | string;
}

interface Countdown {
  time_left: number;
}

interface GameRoomStatusBannerProps {
  gamePhase: 'waiting' | 'countdown' | 'ready' | 'active' | 'finished';
  winner?: boolean;
  user?: User | null;
  players: Player[];
  countdown?: Countdown | null;
  handleStartGame: () => void;
}

export function GameRoomStatusBanner({
  gamePhase,
  winner,
  user,
  players,
  countdown,
  handleStartGame,
}: GameRoomStatusBannerProps) {
  return (
    <>
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
          Game will start automatically in {countdown?.time_left ?? 0} seconds
        </div>
      )}
      {gamePhase === 'ready' && (
        <div className="mb-4 text-center text-purple-700 font-semibold">
          Game is ready to start.<br />
          {players.length > 0 && user && players[0].id === user.id ? (
            <button
              onClick={handleStartGame}
              className="mt-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-bold shadow hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
            >
              Start Game
            </button>
          ) : (
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
    </>
  );
}

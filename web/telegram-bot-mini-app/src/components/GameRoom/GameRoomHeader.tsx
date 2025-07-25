import { ArrowLeft, Users, Trophy, Timer } from 'lucide-react';

interface Room {
  id: number | string;
  bet_amount: number;
}

interface User {
  id: number | string;
  first_name?: string;
  // Add more user fields if needed
}

interface GameRoomHeaderProps {
  room: Room;
  user?: User | null;
  players: User[];
  gameTime: number; // in seconds
  onBack: () => void;
  handleLeaveRoomButton: () => void;
}

export function GameRoomHeader({
  room,
  players,
  gameTime,
  onBack,
  handleLeaveRoomButton,
}: GameRoomHeaderProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
      <button
        onClick={onBack}
        className="p-2 rounded-full hover:bg-gray-200"
        aria-label="Go back"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>
      <h1 className="text-2xl font-bold">{`Room #${room?.id ?? ''}`}</h1>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <Users className="h-5 w-5" />
          <span>{players?.length ?? 0}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Trophy className="h-5 w-5" />
          <span>{room?.bet_amount?.toFixed(2) ?? '0.00'} ETB</span>
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
  );
}

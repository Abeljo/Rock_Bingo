
import { Trophy } from 'lucide-react';

interface Room {
  bet_amount?: number;
}

interface GameRoomPrizePoolProps {
  players: Array<unknown>; // or specify Player type if available
  room: Room;
}

export function GameRoomPrizePool({ players, room }: GameRoomPrizePoolProps) {
  const prizePool = (players.length * (room.bet_amount ?? 0)).toFixed(2);
  
  return (
    <div className="flex items-center gap-2">
      <Trophy className="h-5 w-5 text-yellow-500" />
      <span className="font-semibold text-gray-700">Prize Pool:</span>
      <span className="text-lg font-bold text-purple-700">{prizePool} ETB</span>
    </div>
  );
}

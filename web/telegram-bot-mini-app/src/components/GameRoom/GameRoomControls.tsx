
import { Play, Check } from 'lucide-react';

interface GameRoomControlsProps {
  session: {
    status: string;
  } | null;
  handleDrawNumber: () => void;
  handleClaimBingo: () => void;
}

export function GameRoomControls({
  session,
  handleDrawNumber,
  handleClaimBingo,
}: GameRoomControlsProps) {
  if (!session || session.status !== 'active') return null;

  return (
    <div className="space-y-3">
      <button
        onClick={handleDrawNumber}
        aria-label="Draw next number"
        className="w-full py-3 px-4 bg-purple-500 text-white font-bold rounded-lg shadow hover:bg-purple-600 transition-colors"
      >
        <Play className="h-5 w-5 inline mr-2" />
        Draw Number
      </button>

      <button
        onClick={handleClaimBingo}
        aria-label="Claim Bingo"
        className="w-full py-3 px-4 bg-green-500 text-white font-bold rounded-lg shadow hover:bg-green-600 transition-colors"
      >
        <Check className="h-5 w-5 inline mr-2" />
        Claim Bingo
      </button>
    </div>
  );
}

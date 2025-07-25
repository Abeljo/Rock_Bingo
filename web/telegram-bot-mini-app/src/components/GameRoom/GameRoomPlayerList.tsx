
interface Player {
  id: string | number;
  first_name: string;
}

interface GameRoomPlayerListProps {
  players: Player[];
  user?: { id: string | number } | null;
}

export function GameRoomPlayerList({ players, user }: GameRoomPlayerListProps) {
  return (
    <div className="bg-white rounded-lg p-4 shadow">
      <h3 className="font-bold mb-3">Players ({players.length})</h3>
      <ul className="space-y-2">
        {players.map((player) => (
          <li key={player.id} className="flex items-center justify-between">
            <span className="text-gray-700">{player.first_name}</span>
            {user && player.id === user.id && (
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">You</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

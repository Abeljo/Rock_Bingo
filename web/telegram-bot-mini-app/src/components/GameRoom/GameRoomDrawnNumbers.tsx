
interface GameRoomDrawnNumbersProps {
  drawnNumbers: number[];
  latestNumber: number | null;
}

export function GameRoomDrawnNumbers({
  drawnNumbers,
  latestNumber,
}: GameRoomDrawnNumbersProps) {
  return (
    <div className="bg-white rounded-lg p-4 shadow">
      <h3 className="font-bold mb-3 text-center">Drawn Numbers</h3>

      {drawnNumbers.length === 0 ? (
        <p className="text-gray-500 text-center text-sm">No numbers drawn yet</p>
      ) : (
        <div
          className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto"
          aria-live="polite"
        >
          {drawnNumbers.map((number, index) => (
            <div
              key={index}
              className={`text-center py-2 rounded font-bold transition-all duration-300
                ${
                  number === latestNumber
                    ? 'bg-yellow-300 text-yellow-900 scale-110 shadow-lg animate-bounce'
                    : 'bg-blue-100 text-blue-800'
                }`}
            >
              {number}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

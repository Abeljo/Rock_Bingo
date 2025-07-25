import React from 'react';

interface BingoCardProps {
  cardData: {
    grid: number[][];
    marks: boolean[][];
  };
  cardNumber: number;
  onNumberClick?: (row: number, col: number, number: number) => void;
  disabled?: boolean;
}

const bingoHeaders = ['B', 'I', 'N', 'G', 'O'];

// Function to check if number matches the column's BINGO range
const isValidNumberForColumn = (col: number, num: number) => {
  switch (col) {
    case 0: return num >= 1 && num <= 15;
    case 1: return num >= 16 && num <= 30;
    case 2: return num >= 31 && num <= 45;
    case 3: return num >= 46 && num <= 60;
    case 4: return num >= 61 && num <= 75;
    default: return false;
  }
};

const isCenter = (row: number, col: number) => row === 2 && col === 2;

function BingoCardComponent({ cardData, cardNumber, onNumberClick, disabled = false }: BingoCardProps) {
  const handleNumberClick = (row: number, col: number, number: number) => {
    if (!disabled && onNumberClick && !isCenter(row, col)) {
      onNumberClick(row, col, number);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm mx-auto select-none">
      {/* Card Header */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">BINGO</h3>
        <p className="text-sm text-gray-600">Card #{cardNumber}</p>
      </div>

      {/* Bingo Headers */}
      <div className="grid grid-cols-5 gap-1 mb-2">
        {bingoHeaders.map((header) => (
          <div
            key={header}
            className="text-center font-bold text-purple-700 text-lg select-none"
            aria-label={`${header} column`}
          >
            {header}
          </div>
        ))}
      </div>

      {/* Bingo Grid */}
      <div className="grid grid-cols-5 gap-1">
        {cardData.grid.map((row, rowIndex) =>
          row.map((number, colIndex) => {
            // Validate number against BINGO column range for safety
            const validNumber = isValidNumberForColumn(colIndex, number);
            // Mark center cell as always marked (free space)
            const marked = cardData.marks[rowIndex][colIndex] || isCenter(rowIndex, colIndex);
            const isFreeSpace = isCenter(rowIndex, colIndex);

            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                type="button"
                onClick={() => handleNumberClick(rowIndex, colIndex, number)}
                disabled={disabled || isFreeSpace}
                aria-pressed={marked}
                aria-label={isFreeSpace ? 'Free Space' : marked ? `Marked number ${number}` : `Number ${number}`}
                title={isFreeSpace ? 'Free Space' : marked ? 'Marked' : 'Click to mark'}
                className={`
                  aspect-square rounded border-2 font-bold text-sm transition-all duration-300
                  flex items-center justify-center relative
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
                  ${marked
                    ? isFreeSpace
                      ? 'bg-yellow-300 border-yellow-500 text-white shadow-inner cursor-default'
                      : 'bg-green-500 border-green-600 text-white shadow-lg'
                    : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer'
                  }
                  ${disabled || isFreeSpace ? 'opacity-70 cursor-not-allowed' : ''}
                `}
                style={{
                  transitionProperty: 'background-color, border-color, color, box-shadow',
                }}
              >
                {isFreeSpace ? (
                  <span className="flex flex-col items-center select-none pointer-events-none">
                    <span className="text-xl">★</span>
                    <span className="text-xs font-bold mt-1">FREE</span>
                  </span>
                ) : (
                  validNumber ? number : <span className="text-red-500 text-xs">ERR</span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Card Footer */}
      <div className="text-center mt-4">
        <p className="text-xs text-gray-500 select-none">
          Tap numbers as they’re called to mark them. Center is a free space!
        </p>
      </div>
    </div>
  );
}

export const BingoCard = React.memo(BingoCardComponent);

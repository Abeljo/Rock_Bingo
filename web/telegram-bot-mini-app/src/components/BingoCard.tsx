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

export function BingoCard({ cardData, cardNumber, onNumberClick, disabled = false }: BingoCardProps) {
  const handleNumberClick = (row: number, col: number, number: number) => {
    if (!disabled && onNumberClick) {
      onNumberClick(row, col, number);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm mx-auto">
      {/* Card Header */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">BINGO</h3>
        <p className="text-sm text-gray-600">Card #{cardNumber}</p>
      </div>

      {/* Bingo Grid */}
      <div className="grid grid-cols-5 gap-1">
        {cardData.grid.map((row, rowIndex) =>
          row.map((number, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              onClick={() => handleNumberClick(rowIndex, colIndex, number)}
              disabled={disabled}
              className={`
                aspect-square rounded border-2 font-bold text-sm transition-all duration-200
                ${cardData.marks[rowIndex][colIndex]
                  ? 'bg-green-500 border-green-600 text-white'
                  : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {number}
            </button>
          ))
        )}
      </div>

      {/* Card Footer */}
      <div className="text-center mt-4">
        <p className="text-xs text-gray-500">
          Click numbers to mark them when called
        </p>
      </div>
    </div>
  );
}

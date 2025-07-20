import React from 'react';
import { Check } from 'lucide-react';

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
  const bingoHeaders = ['B', 'I', 'N', 'G', 'O'];
  const isCenter = (row: number, col: number) => row === 2 && col === 2;
  const handleNumberClick = (row: number, col: number, number: number) => {
    if (!disabled && onNumberClick && !isCenter(row, col)) {
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

      {/* Bingo Grid with Headers */}
      <div className="grid grid-cols-5 gap-1 mb-2">
        {bingoHeaders.map((header, idx) => (
          <div key={header} className="text-center font-bold text-purple-700 text-lg">{header}</div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-1">
        {cardData.grid.map((row, rowIndex) =>
          row.map((number, colIndex) => {
            const marked = cardData.marks[rowIndex][colIndex] || isCenter(rowIndex, colIndex);
            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleNumberClick(rowIndex, colIndex, number)}
                disabled={disabled || isCenter(rowIndex, colIndex)}
                className={`
                  aspect-square rounded border-2 font-bold text-sm transition-all duration-200 flex items-center justify-center relative
                  ${marked
                    ? isCenter(rowIndex, colIndex)
                      ? 'bg-yellow-300 border-yellow-500 text-white shadow-inner'
                      : 'bg-green-500 border-green-600 text-white shadow-lg animate-pulse'
                    : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                  }
                  ${disabled || isCenter(rowIndex, colIndex) ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
                `}
                title={isCenter(rowIndex, colIndex) ? 'Free Space' : marked ? 'Marked' : 'Click to mark'}
              >
                {isCenter(rowIndex, colIndex) ? (
                  <span className="flex flex-col items-center">
                    <span className="text-xl">★</span>
                    <span className="text-xs font-bold mt-1">FREE</span>
                  </span>
                ) : marked ? (
                  <span className="text-white font-bold text-lg">{number}</span>
                ) : (
                  number
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Card Footer */}
      <div className="text-center mt-4">
        <p className="text-xs text-gray-500">
          Tap numbers as they’re called to mark them. Center is a free space!
        </p>
      </div>
    </div>
  );
}

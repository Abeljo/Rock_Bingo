import React from 'react';
import { BingoCard as BingoCardType } from '../types';

interface BingoCardProps {
  card: BingoCardType;
  onMarkNumber: (number: number) => void;
  drawnNumbers: number[];
}

export function BingoCard({ card, onMarkNumber, drawnNumbers }: BingoCardProps) {
  const handleNumberClick = (number: number) => {
    if (drawnNumbers.includes(number)) {
      onMarkNumber(number);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="grid grid-cols-5 gap-2">
        {card.card_data.grid.map((row, rowIndex) =>
          row.map((number, colIndex) => {
            const isMarked = card.card_data.marks[rowIndex][colIndex];
            const isDrawn = drawnNumbers.includes(number);
            const isFreeSpace = number === 0;

            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleNumberClick(number)}
                disabled={!isDrawn && !isFreeSpace}
                className={`
                  w-12 h-12 rounded-full font-bold text-lg transition-all duration-200 
                  ${isMarked || isFreeSpace ? 'bg-blue-500 text-white' : ''}
                  ${isDrawn && !isMarked ? 'bg-yellow-300 hover:bg-yellow-400' : ''}
                  ${!isDrawn && !isFreeSpace ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : ''}
                `}
              >
                {isFreeSpace ? '★' : number}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

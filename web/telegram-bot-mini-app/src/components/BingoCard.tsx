import React, { useState, useEffect } from 'react';
import { BingoCard as BingoCardType } from '../types';

interface BingoCardProps {
  card: BingoCardType;
  calledNumbers: number[];
  onMarkNumber: (row: number, col: number) => void;
  isInteractive?: boolean;
}

export function BingoCard({ card, calledNumbers, onMarkNumber, isInteractive = true }: BingoCardProps) {
  const [animatedNumbers, setAnimatedNumbers] = useState<Set<number>>(new Set());

  useEffect(() => {
    const lastCalled = calledNumbers[calledNumbers.length - 1];
    if (lastCalled) {
      setAnimatedNumbers(prev => new Set(prev).add(lastCalled));
      setTimeout(() => {
        setAnimatedNumbers(prev => {
          const newSet = new Set(prev);
          newSet.delete(lastCalled);
          return newSet;
        });
      }, 1000);
    }
  }, [calledNumbers]);

  const isNumberCalled = (number: number) => calledNumbers.includes(number);
  const isNumberAnimated = (number: number) => animatedNumbers.has(number);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-center text-gray-800 mb-2">BINGO</h3>
        <div className="flex justify-center space-x-4 text-sm font-semibold text-gray-600 mb-4">
          <span>B</span>
          <span>I</span>
          <span>N</span>
          <span>G</span>
          <span>O</span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {card.numbers.map((row, rowIndex) =>
          row.map((number, colIndex) => {
            const isMarked = card.marked[rowIndex][colIndex];
            const isCalled = isNumberCalled(number);
            const isAnimated = isNumberAnimated(number);
            const isFreeSpace = rowIndex === 2 && colIndex === 2;

            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => isInteractive && onMarkNumber(rowIndex, colIndex)}
                disabled={!isInteractive || (!isCalled && !isFreeSpace)}
                className={`
                  w-12 h-12 rounded-lg font-bold text-sm transition-all duration-300 transform
                  ${isMarked || isFreeSpace
                    ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg scale-95'
                    : isCalled
                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-md hover:scale-105'
                    : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }
                  ${isAnimated ? 'animate-pulse scale-110' : ''}
                  ${isInteractive && isCalled && !isMarked ? 'cursor-pointer hover:shadow-lg' : ''}
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
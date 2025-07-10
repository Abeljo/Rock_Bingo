import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface NumberCallerProps {
  currentNumber?: number;
  calledNumbers: number[];
  onDrawNumber: () => void;
  isGameActive: boolean;
}

export function NumberCaller({ currentNumber, calledNumbers, onDrawNumber, isGameActive }: NumberCallerProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleDraw = async () => {
    if (isDrawing || !isGameActive) return;
    
    setIsDrawing(true);
    await onDrawNumber();
    
    setTimeout(() => {
      setIsDrawing(false);
    }, 1000);
  };

  const getBingoLetter = (number: number) => {
    if (number >= 1 && number <= 15) return 'B';
    if (number >= 16 && number <= 30) return 'I';
    if (number >= 31 && number <= 45) return 'N';
    if (number >= 46 && number <= 60) return 'G';
    if (number >= 61 && number <= 75) return 'O';
    return '';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Number Caller</h2>
        
        {/* Current Number Display */}
        <div className="mb-6">
          {currentNumber ? (
            <div className={`inline-block p-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-xl transform transition-all duration-500 ${isDrawing ? 'animate-bounce scale-110' : ''}`}>
              <div className="text-center">
                <div className="text-2xl font-bold">{getBingoLetter(currentNumber)}</div>
                <div className="text-4xl font-bold">{currentNumber}</div>
              </div>
            </div>
          ) : (
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-gray-400 text-xl">?</span>
            </div>
          )}
        </div>

        {/* Draw Button */}
        <button
          onClick={handleDraw}
          disabled={isDrawing || !isGameActive}
          className={`
            px-8 py-3 rounded-full font-semibold text-white transition-all duration-300 transform
            ${isGameActive && !isDrawing
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 hover:scale-105 shadow-lg'
              : 'bg-gray-300 cursor-not-allowed'
            }
          `}
        >
          {isDrawing ? 'Drawing...' : 'Draw Number'}
        </button>

        {/* Controls */}
        <div className="mt-6 flex items-center justify-center space-x-4">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5 text-gray-600" />
            ) : (
              <Volume2 className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Called Numbers Count */}
        <div className="mt-4 text-sm text-gray-600">
          Numbers Called: {calledNumbers.length} / 75
        </div>
      </div>
    </div>
  );
}
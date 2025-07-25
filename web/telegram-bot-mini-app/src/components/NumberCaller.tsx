import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface NumberCallerProps {
  currentNumber?: number;
  calledNumbers: number[];
  onDrawNumber: () => Promise<void> | void;
  isGameActive: boolean;
  animationSpeed?: number; // ms duration for bounce animation, default 500
  maxHistoryLength?: number; // how many called numbers to keep visible, default 30
}

export function NumberCaller({
  currentNumber,
  calledNumbers,
  onDrawNumber,
  isGameActive,
  animationSpeed = 500,
  maxHistoryLength = 30,
}: NumberCallerProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastAnnouncedNumber, setLastAnnouncedNumber] = useState<number | null>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const numbersEndRef = useRef<HTMLDivElement>(null);

  const handleDraw = async () => {
    if (isDrawing || !isGameActive) return;

    setIsDrawing(true);
    await onDrawNumber();

    setTimeout(() => {
      setIsDrawing(false);
    }, animationSpeed);
  };

  // Scroll called numbers container to bottom when new number is added
  useEffect(() => {
    if (numbersEndRef.current) {
      numbersEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [calledNumbers]);

  // Announce new number to screen reader politely
  useEffect(() => {
    if (currentNumber !== undefined && currentNumber !== null && currentNumber !== lastAnnouncedNumber) {
      setLastAnnouncedNumber(currentNumber);
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = `New number called: ${getBingoLetter(currentNumber)} ${currentNumber}`;
      }
    }
  }, [currentNumber, lastAnnouncedNumber]);

  const getBingoLetter = (number: number) => {
    if (number >= 1 && number <= 15) return 'B';
    if (number >= 16 && number <= 30) return 'I';
    if (number >= 31 && number <= 45) return 'N';
    if (number >= 46 && number <= 60) return 'G';
    if (number >= 61 && number <= 75) return 'O';
    return '';
  };

  // Limit visible called numbers for performance and UX
  const visibleCalledNumbers = calledNumbers.slice(-maxHistoryLength);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 max-w-md mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Number Caller</h2>

        {/* Current Number Display */}
        <div
          className={`mb-6 inline-block p-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-xl transform transition-transform duration-${animationSpeed} ${
            isDrawing ? 'animate-bounce scale-110' : ''
          }`}
          aria-live="polite"
          aria-atomic="true"
          aria-label={currentNumber ? `Current number is ${getBingoLetter(currentNumber)} ${currentNumber}` : 'No number called yet'}
        >
          {currentNumber ? (
            <div className="text-center select-none">
              <div className="text-2xl font-bold">{getBingoLetter(currentNumber)}</div>
              <div className="text-4xl font-bold">{currentNumber}</div>
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
          className={`px-8 py-3 rounded-full font-semibold text-white transition-transform duration-300 transform ${
            isGameActive && !isDrawing
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 hover:scale-105 shadow-lg'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
          aria-disabled={isDrawing || !isGameActive}
        >
          {isDrawing ? 'Drawing...' : 'Draw Number'}
        </button>

        {/* Controls */}
        <div className="mt-6 flex items-center justify-center space-x-4">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            aria-pressed={isMuted}
            aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {isMuted ? <VolumeX className="h-5 w-5 text-gray-600" /> : <Volume2 className="h-5 w-5 text-gray-600" />}
          </button>
        </div>

        {/* Called Numbers Count */}
        <div className="mt-4 text-sm text-gray-600 select-none">
          Numbers Called: {calledNumbers.length} / 75
        </div>

        {/* Called Numbers History - scrollable */}
        <div
          className="mt-4 max-h-48 overflow-y-auto rounded-lg border border-gray-300 p-3 bg-gray-50 font-mono text-center text-gray-700 space-x-1 flex flex-wrap justify-center"
          aria-live="polite"
          aria-atomic="false"
          aria-label="Called bingo numbers history"
          role="log"
        >
          {visibleCalledNumbers.length === 0 && <span>No numbers called yet</span>}
          {visibleCalledNumbers.map((num, idx) => (
            <span
              key={`${num}-${idx}`}
              className="inline-block w-8 h-8 rounded-full bg-purple-300 text-purple-900 font-bold flex items-center justify-center m-0.5 select-text"
              aria-label={`${getBingoLetter(num)} ${num}`}
            >
              {num}
            </span>
          ))}
          {/* Dummy div to scroll into view */}
          <div ref={numbersEndRef} />
        </div>

        {/* Aria live region for announcing new numbers */}
        <div
          ref={liveRegionRef}
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
        ></div>
      </div>
    </div>
  );
}

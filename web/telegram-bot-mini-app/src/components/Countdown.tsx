import React, { useState, useEffect } from 'react';
import { Clock, Play } from 'lucide-react';

interface CountdownProps {
  timeLeft: number;
  isActive: boolean;
  onGameStart?: () => void;
}

export function Countdown({ timeLeft, isActive, onGameStart }: CountdownProps) {
  const [displayTime, setDisplayTime] = useState(timeLeft);

  useEffect(() => {
    setDisplayTime(timeLeft);
  }, [timeLeft]);

  useEffect(() => {
    if (!isActive || displayTime <= 0) return;

    const timer = setInterval(() => {
      setDisplayTime(prev => {
        const newTime = prev - 1;
        if (newTime <= 0 && onGameStart) {
          console.log('Countdown finished, calling onGameStart');
          onGameStart();
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, displayTime, onGameStart]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isActive) {
    return null;
  }

  const isWarning = displayTime <= 10;
  const isCritical = displayTime <= 5;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className={`
        bg-white rounded-lg shadow-lg px-6 py-4 border-2
        ${isCritical ? 'border-red-500 bg-red-50' : 
          isWarning ? 'border-yellow-500 bg-yellow-50' : 
          'border-blue-500 bg-blue-50'}
        transition-all duration-300
      `}>
        <div className="flex items-center justify-center space-x-3">
          <Clock className={`h-6 w-6 ${
            isCritical ? 'text-red-600' : 
            isWarning ? 'text-yellow-600' : 
            'text-blue-600'
          }`} />
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600">
              Game starts in
            </div>
            <div className={`
              text-3xl font-bold
              ${isCritical ? 'text-red-600' : 
                isWarning ? 'text-yellow-600' : 
                'text-blue-600'}
            `}>
              {formatTime(displayTime)}
            </div>
          </div>
          <Play className={`h-6 w-6 ${
            isCritical ? 'text-red-600' : 
            isWarning ? 'text-yellow-600' : 
            'text-blue-600'
          }`} />
        </div>
      </div>
    </div>
  );
} 
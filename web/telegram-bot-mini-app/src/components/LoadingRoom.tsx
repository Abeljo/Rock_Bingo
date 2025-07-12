import React from 'react';
import { Loader2, Users, DollarSign } from 'lucide-react';

interface LoadingRoomProps {
  betAmount: number;
}

export function LoadingRoom({ betAmount }: LoadingRoomProps) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Loading Animation */}
          <div className="mb-6">
            <Loader2 className="h-12 w-12 text-purple-500 animate-spin mx-auto" />
          </div>
          
          {/* Bet Amount Display */}
          <div className="mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <DollarSign className="h-6 w-6 text-green-600" />
              <span className="text-2xl font-bold text-gray-900">
                ${betAmount.toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-gray-600">Bet Amount</p>
          </div>
          
          {/* Status Messages */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-700">Finding available room...</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <span className="text-sm text-gray-700">Joining room...</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              <span className="text-sm text-gray-700">Preparing game...</span>
            </div>
          </div>
          
          {/* Players Icon */}
          <div className="mt-6">
            <div className="flex items-center justify-center space-x-1">
              <Users className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">Waiting for players...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
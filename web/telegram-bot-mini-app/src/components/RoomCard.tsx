import React from 'react';
import { Users, DollarSign, Trophy, Clock } from 'lucide-react';
import { Room } from '../types';

interface RoomCardProps {
  room: Room;
  onJoin?: (roomId: string) => void;
  onView?: (roomId: string) => void;
  disabled?: boolean;
}

export function RoomCard({ room, onJoin, onView, disabled }: RoomCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Clock className="h-4 w-4" />;
      case 'active':
        return <Users className="h-4 w-4" />;
      case 'completed':
        return <Trophy className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">{room.name}</h3>
          <p className="text-sm text-gray-600">{room.description}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${getStatusColor(room.status)}`}>
          {getStatusIcon(room.status)}
          <span className="capitalize">{room.status}</span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {room.current_players}/{room.max_players}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <DollarSign className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">${room.entry_fee}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Trophy className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">${room.prize_pool}</span>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={() => onView && onView(room.id)}
          disabled={disabled}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
        >
          View Details
        </button>
        <button
          onClick={() => onJoin && onJoin(room.id)}
          disabled={disabled || room.status === 'completed' || room.current_players >= room.max_players}
          className={`
            flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200
            ${room.status === 'waiting' && room.current_players < room.max_players
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 shadow-lg hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {room.status === 'completed' ? 'Finished' : 
           room.current_players >= room.max_players ? 'Full' : 'Join Room'}
        </button>
      </div>
    </div>
  );
}
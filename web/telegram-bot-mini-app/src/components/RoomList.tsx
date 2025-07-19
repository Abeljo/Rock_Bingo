import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { RoomCard } from './RoomCard';
import { Room } from '../types';
import { apiService } from '../services/api';

interface RoomListProps {
  onJoinRoom: (roomId: string) => void;
  onViewRoom: (roomId: string) => void;
}

export function RoomList({ onJoinRoom, onViewRoom }: RoomListProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: '',
    description: '',
    max_players: 10,
    entry_fee: 5,
  });

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const data = await apiService.getRooms();
      setRooms(data);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    try {
      await apiService.createRoom(newRoom);
      setShowCreateModal(false);
      setNewRoom({ name: '', description: '', max_players: 10, entry_fee: 5 });
      loadRooms();
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Debug: log all room IDs to check for uniqueness and presence
  console.log('Room IDs:', rooms.map(r => r.id));

  // If all room IDs are null, show a user-friendly error
  const allIdsNull = rooms.length > 0 && rooms.every(r => r.id == null);
  if (allIdsNull) {
    return (
      <div className="text-center text-red-600 font-bold p-8">
        Error: Rooms could not be loaded correctly.<br />
        Please try again later or contact support.<br />
        (Room IDs are missing. This is a backend data issue.)
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Game Rooms</h2>
          <p className="text-gray-600 mt-2">Join a room to start playing bingo!</p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={loadRooms}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-lg"
          >
            <Plus className="h-4 w-4" />
            <span>Create Room</span>
          </button>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room, idx) => {
          const percentFull = Math.min(100, Math.round((room.current_players / room.max_players) * 100));
          const isAlmostFull = percentFull >= 80;
          // If room has countdown info, show it
          const countdown = room.countdown_time_left;
          return (
            <div key={room.id ?? idx} className="relative bg-white rounded-xl shadow-lg p-6 flex flex-col gap-3 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg text-purple-700">Room #{room.id}</span>
                <span className="text-sm text-gray-500">Bet: {room.bet_amount} ETB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-semibold">{room.current_players}/{room.max_players} players</span>
                {isAlmostFull && <span className="ml-2 px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-bold animate-pulse">Almost Full</span>}
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-1 mb-2">
                <div className={`h-full rounded-full transition-all duration-500 ${isAlmostFull ? 'bg-yellow-400' : 'bg-purple-400'}`} style={{ width: `${percentFull}%` }}></div>
              </div>
              {typeof countdown === 'number' && countdown > 0 && (
                <div className="text-center text-blue-600 font-semibold text-sm mb-2 animate-pulse">
                  Game starts in {countdown}s
                </div>
              )}
              <RoomCard
                room={room}
                onJoin={room.id ? onJoinRoom : undefined}
                onView={room.id ? onViewRoom : undefined}
                disabled={!room.id}
              />
            </div>
          );
        })}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Room</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Name
                </label>
                <input
                  type="text"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter room name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows={3}
                  placeholder="Enter room description"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Players
                  </label>
                  <input
                    type="number"
                    value={newRoom.max_players}
                    onChange={(e) => setNewRoom({ ...newRoom, max_players: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    min="2"
                    max="50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entry Fee ($)
                  </label>
                  <input
                    type="number"
                    value={newRoom.entry_fee}
                    onChange={(e) => setNewRoom({ ...newRoom, entry_fee: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
              >
                Create Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
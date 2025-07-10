import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RoomList } from './components/RoomList';
import { GameRoom } from './components/GameRoom';
import { WalletModal } from './components/WalletModal';
import { useTelegram } from './hooks/useTelegram';
import { Room } from './types';
import { apiService } from './services/api';

type AppState = 'rooms' | 'game';

// Utility to ensure userId is always a string
function getStringUserId(id: unknown): string {
  if (typeof id === 'string') return id;
  if (typeof id === 'number') return id.toString();
  return '';
}

function App() {
  const [currentState, setCurrentState] = useState<AppState>('rooms');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [showWallet, setShowWallet] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const { user, authResponse, authError } = useTelegram();
  const realUserId = getStringUserId(authResponse?.ID);

  useEffect(() => {
    if (authResponse?.ID) {
      loadWallet(authResponse.ID);
    }
  }, [authResponse]);

  const loadWallet = async (userId: string) => {
    try {
      const walletData = await apiService.getWallet(userId);
      setWallet(walletData);
    } catch (error) {
      console.error('Failed to load wallet:', error);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    try {
      await apiService.joinRoom(roomId);
      const room = await apiService.getRoom(roomId);
      setSelectedRoom(room);
      setCurrentState('game');
    } catch (error) {
      console.error('Failed to join room:', error);
    }
  };

  const handleViewRoom = async (roomId: string) => {
    try {
      const room = await apiService.getRoom(roomId);
      setSelectedRoom(room);
      setCurrentState('game');
    } catch (error) {
      console.error('Failed to view room:', error);
    }
  };

  const handleBackToRooms = () => {
    setCurrentState('rooms');
    setSelectedRoom(null);
  };

  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-gray-600">{authError}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to BingoMaster</h1>
          <p className="text-gray-600 mb-6">Please open this app through Telegram to play.</p>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Header
        balance={wallet}
        onProfileClick={() => setShowProfile(true)}
        onWalletClick={() => setShowWallet(true)}
        onMenuClick={() => setShowMenu(true)}
      />

      {currentState === 'rooms' && (
        <RoomList
          onJoinRoom={handleJoinRoom}
          onViewRoom={handleViewRoom}
        />
      )}

      {currentState === 'game' && selectedRoom && (
        <GameRoom
          room={selectedRoom}
          onBack={handleBackToRooms}
        />
      )}

      {realUserId ? (
        <WalletModal
          isOpen={showWallet}
          onClose={() => setShowWallet(false)}
          onBalanceUpdate={(newBalance) => setWallet((prev: any) => ({ ...prev, Balance: newBalance }))}
          userId={realUserId}
        />
      ) : null}

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
              <button
                onClick={() => setShowProfile(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                <span className="sr-only">Close</span>
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {user.first_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {user.first_name} {user.last_name}
                  </h3>
                  <p className="text-gray-600">@{user.username}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-purple-600">0</p>
                    <p className="text-sm text-gray-600">Games Won</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">0</p>
                    <p className="text-sm text-gray-600">Games Played</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menu Modal */}
      {showMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Menu</h2>
              <button
                onClick={() => setShowMenu(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                <span className="sr-only">Close</span>
                ×
              </button>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowProfile(true);
                }}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                Profile
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowWallet(true);
                }}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                Wallet
              </button>
              <button
                onClick={() => setShowMenu(false)}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                Settings
              </button>
              <button
                onClick={() => setShowMenu(false)}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                Help & Support
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
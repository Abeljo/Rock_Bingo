import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { RoomList } from './components/RoomList';
import { GameRoom } from './components/GameRoom';
import { LoadingRoom } from './components/LoadingRoom';
import { WalletModal } from './components/WalletModal';
import { ProfileModal } from './components/ProfileModal';
import { MenuModal } from './components/MenuModal';
import { useTelegram } from './hooks/useTelegram';
import { Room, User, Wallet } from './types';
import { apiService } from './services/api';
import { getBetAmount } from './utils/urlParams';

function App() {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [showWallet, setShowWallet] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const { user: telegramUser } = useTelegram();
  
  // Get bet amount from URL parameters
  const betAmount = getBetAmount();
  
  // Ref to track if we've already attempted to join a room
  const hasAttemptedJoin = useRef(false);

  // Authenticate and set user
  useEffect(() => {
    if (telegramUser) {
      apiService.authenticateTelegram({
        telegram_id: telegramUser.id,
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
      }).then(setUser);
    }
  }, [telegramUser]);

  // Reset join attempt when user changes
  useEffect(() => {
    hasAttemptedJoin.current = false;
  }, [user]);

  // Auto-join room with bet amount
  useEffect(() => {
    if (user && betAmount && !selectedRoom && !hasAttemptedJoin.current) {
      hasAttemptedJoin.current = true;
      setIsLoadingRoom(true);
      setRoomError(null);
      
      apiService.findOrCreateRoom(user.id, betAmount)
        .then((room) => {
          setSelectedRoom(room);
          setIsLoadingRoom(false);
        })
        .catch((error) => {
          console.error('Failed to join room:', error);
          setRoomError(error.message || 'Failed to join room');
          setIsLoadingRoom(false);
        });
    }
  }, [user, betAmount, selectedRoom]);

  // Load wallet when user changes
  const loadWallet = useCallback(() => {
    if (user) {
      apiService.getWallet(user.id).then(setWallet);
    }
  }, [user]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  // Refresh wallet after closing modal
  const handleWalletClose = () => {
    setShowWallet(false);
    loadWallet();
  };

  // Update wallet balance after deposit/withdraw
  const handleBalanceUpdate = (newBalance: number) => {
    setWallet((prev) => (prev ? { ...prev, balance: newBalance } : prev));
  };

  // Update handleRoomSelect to accept roomId and find the Room object
  const handleRoomSelect = (roomId: string) => {
    const room = rooms.find(r => String(r.id) === String(roomId));
    if (room) setSelectedRoom(room);
  };

  const handleBackToLobby = () => {
    setSelectedRoom(null);
    hasAttemptedJoin.current = false;
  };

  // Modal handlers
  const handleProfileClose = () => {
    setShowProfile(false);
  };

  const handleMenuClose = () => {
    setShowMenu(false);
  };

  const handleMenuNavigate = (route: string) => {
    // Handle navigation based on route
    switch (route) {
      case 'home':
        setSelectedRoom(null);
        break;
      case 'leaderboard':
        // TODO: Implement leaderboard
        console.log('Navigate to leaderboard');
        break;
      case 'help':
        // TODO: Implement help
        console.log('Navigate to help');
        break;
      case 'about':
        // TODO: Implement about
        console.log('Navigate to about');
        break;
      case 'settings':
        // TODO: Implement settings
        console.log('Navigate to settings');
        break;
      case 'privacy':
        // TODO: Implement privacy
        console.log('Navigate to privacy');
        break;
      default:
        break;
    }
  };

  // RoomList handlers for join/view (for compatibility)
  const handleJoinRoom = (roomId: string) => {
    // You may want to fetch the room by ID and setSelectedRoom
    // For now, just reload rooms or handle as needed
  };
  const handleViewRoom = (roomId: string) => {
    // You may want to fetch the room by ID and setSelectedRoom
    // For now, just reload rooms or handle as needed
  };

  // Show loading screen if we're joining a room
  if (isLoadingRoom && betAmount) {
    return <LoadingRoom betAmount={betAmount} />;
  }

  // Show error if room joining failed
  if (roomError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Join Room</h2>
          <p className="text-gray-600 mb-6">{roomError}</p>
          <button
            onClick={() => {
              setRoomError(null);
              setIsLoadingRoom(false);
            }}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header
        balance={wallet?.balance ?? 0}
        onWalletClick={() => setShowWallet(true)}
        onProfileClick={() => setShowProfile(true)}
        onMenuClick={() => setShowMenu(true)}
        userName={user?.first_name}
      />
      <main className="p-4">
        {selectedRoom ? (
          <GameRoom room={selectedRoom} onBack={handleBackToLobby} />
        ) : (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Bet Amount</h2>
              <p className="text-gray-600">This app should be launched from the bot with a bet amount.</p>
              {/* Show available rooms if user is authenticated */}
              {user && (
                <RoomList
                  onJoinRoom={handleRoomSelect}
                  onViewRoom={handleRoomSelect}
                />
              )}
            </div>
          </div>
        )}
      </main>
      {user && (
        <WalletModal
          isOpen={showWallet}
          onClose={handleWalletClose}
          onBalanceUpdate={handleBalanceUpdate}
          userId={user.id}
        />
      )}
      
      <ProfileModal
        isOpen={showProfile}
        onClose={handleProfileClose}
        user={user}
      />
      
      <MenuModal
        isOpen={showMenu}
        onClose={handleMenuClose}
        onNavigate={handleMenuNavigate}
      />
    </div>
  );
}

export default App;

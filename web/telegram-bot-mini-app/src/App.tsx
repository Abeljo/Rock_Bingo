import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RoomList } from './components/RoomList';
import { GameRoom } from './components/GameRoom';
import { WalletModal } from './components/WalletModal';
import { useTelegram } from './hooks/useTelegram';
import { Room } from './types';
import { apiService } from './services/api';
import { BingoCard } from './types';

type AppState = 'rooms' | 'game';

// Utility to ensure userId is always a string
function getStringUserId(id: unknown): string {
  if (typeof id === 'string') return id;
  if (typeof id === 'number') return id.toString();
  return '';
}

// Utility to get query parameter from URL
function getQueryParam(param: string): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function App() {
  const [currentState, setCurrentState] = useState<AppState>('rooms');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [showWallet, setShowWallet] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [roomLoading, setRoomLoading] = useState(false);
  const [roomJoinError, setRoomJoinError] = useState<string | null>(null);
  const [joinedRoom, setJoinedRoom] = useState<Room | null>(null);
  const [betAmount, setBetAmount] = useState<number | null>(null);
  const [cards, setCards] = useState<BingoCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(30); // 30 seconds countdown
  const [countdownActive, setCountdownActive] = useState(false);

  const { user, authResponse, authError } = useTelegram();
  const realUserId = getStringUserId(authResponse?.ID || authResponse?.id);

  useEffect(() => {
    // Extract bet amount from URL on mount
    const bet = getQueryParam('bet');
    if (bet) {
      setBetAmount(Number(bet));
    }
  }, []);

  useEffect(() => {
    // After authentication and bet amount is available, auto-join or create room
    if (authResponse?.ID && betAmount && !joinedRoom && !roomLoading && !roomJoinError) {
      setRoomLoading(true);
      setRoomJoinError(null);
      (async () => {
        try {
          console.log('Attempting to find or create room with bet:', betAmount);
          const rooms = await apiService.getRooms();
          let room = rooms.find((r: any) => r.entry_fee === betAmount && r.status === 'waiting');
          console.log('Found room:', room);
          if (!room) {
            room = await apiService.createRoom({ entry_fee: betAmount });
            console.log('Created new room:', room);
          }
          if (room && room.id) {
            await apiService.joinRoom(room.id);
            setJoinedRoom(room);
            console.log('Joined room:', room);
            // Fetch latest wallet after joining room
            if (realUserId) {
              const walletData = await apiService.getWallet(realUserId);
              setWallet(walletData);
            }
          } else {
            throw new Error('Room not found or created');
          }
        } catch (err: any) {
          console.error('Failed to join or create room:', err);
          setRoomJoinError('Failed to join or create room: ' + (err.message || err));
        } finally {
          setRoomLoading(false);
        }
      })();
    }
  }, [authResponse, betAmount, joinedRoom, roomLoading, roomJoinError]);

  // Fetch cards and start countdown after joining room
  useEffect(() => {
    if (joinedRoom) {
      (async () => {
        try {
          const cardsData = await apiService.getRoomCards(joinedRoom.id);
          setCards(Array.isArray(cardsData) ? cardsData : []);
          setCountdown(30); // Reset countdown
          setCountdownActive(true);
        } catch (err) {
          setCards([]);
        }
      })();
    }
  }, [joinedRoom]);

  // Countdown timer effect
  useEffect(() => {
    if (!countdownActive) return;
    if (countdown <= 0) {
      setCountdownActive(false);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, countdownActive]);

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

  // Main content area logic
  let mainContent = null;
  if (roomLoading) {
    mainContent = (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-xl font-bold text-gray-700">Joining Bingo room...</div>
      </div>
    );
  } else if (roomJoinError) {
    mainContent = (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-xl font-bold text-red-600">{roomJoinError}</div>
      </div>
    );
  } else if (joinedRoom) {
    mainContent = (
      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col items-center">
        <div className="text-xl font-bold text-green-700 mb-4 text-center">Joined Room: {joinedRoom.name || joinedRoom.id} (Bet: {joinedRoom.entry_fee})</div>
        <div className="mb-6 w-full flex flex-col items-center">
          <span className="text-lg font-semibold text-gray-800">Game starts in:</span>
          <span className="text-3xl font-mono text-purple-600 mt-2">{countdown}s</span>
        </div>
        <div className="mb-6 w-full">
          <span className="text-lg font-semibold text-gray-800 block mb-2 text-center">Select a Bingo Card:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.isArray(cards) && cards.length === 0 && <div className="text-gray-500 col-span-full text-center">No cards available.</div>}
            {Array.isArray(cards) && cards.map((card) => (
              <div
                key={card.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${selectedCardId === card.id ? 'border-purple-600 bg-purple-50' : 'border-gray-300 bg-white'} flex flex-col items-center`}
                onClick={() => setSelectedCardId(card.id)}
              >
                <div className="font-bold mb-2">Card #{card.id}</div>
                <div className="grid grid-cols-5 gap-1 mb-2">
                  {card.numbers.flat().map((num, idx) => (
                    <div key={idx} className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 text-gray-800 font-mono text-base sm:text-lg">{num}</div>
                  ))}
                </div>
                {selectedCardId === card.id && <div className="mt-2 text-purple-600 font-semibold">Selected</div>}
              </div>
            ))}
          </div>
        </div>
        {countdown <= 0 && (
          <div className="text-2xl font-bold text-blue-700 mt-8 text-center">Game is starting!</div>
        )}
      </div>
    );
  } else if (authError) {
    mainContent = (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-gray-600">{authError}</p>
        </div>
      </div>
    );
  } else if (!user) {
    mainContent = (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to BingoMaster</h1>
          <p className="text-gray-600 mb-6">Please open this app through Telegram to play.</p>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
        </div>
      </div>
    );
  } else {
    mainContent = (
      <>
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
      </>
    );
  }

  // Always render header and modals
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Header
        balance={wallet}
        onProfileClick={() => setShowProfile(true)}
        onWalletClick={() => setShowWallet(true)}
        onMenuClick={() => setShowMenu(true)}
      />
      {mainContent}
      {realUserId ? (
        <WalletModal
          isOpen={showWallet}
          onClose={() => setShowWallet(false)}
          onBalanceUpdate={(newBalance) => setWallet((prev: any) => ({ ...prev, Balance: newBalance }))}
          userId={realUserId}
        />
      ) : null}
      {/* Profile Modal */}
      {showProfile && user && (
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
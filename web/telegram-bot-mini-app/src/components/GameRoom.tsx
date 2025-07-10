import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Users, Timer } from 'lucide-react';
import { BingoCard } from './BingoCard';
import { NumberCaller } from './NumberCaller';
import { Room, BingoCard as BingoCardType, GameSession, Player } from '../types';
import { apiService } from '../services/api';

interface GameRoomProps {
  room: Room;
  onBack: () => void;
}

export function GameRoom({ room, onBack }: GameRoomProps) {
  const [cards, setCards] = useState<BingoCardType[]>([]);
  const [session, setSession] = useState<GameSession | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameTime, setGameTime] = useState(0);

  useEffect(() => {
    loadRoomData();
  }, [room.id]);

  useEffect(() => {
    if (room.status === 'active') {
      const timer = setInterval(() => {
        setGameTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [room.status]);

  const loadRoomData = async () => {
    try {
      const [cardsData, playersData] = await Promise.all([
        apiService.getRoomCards(room.id),
        apiService.getRoomPlayers(room.id),
      ]);
      
      setCards(cardsData);
      setPlayers(playersData);
      
      // Load session if room is active
      if (room.status === 'active') {
        const sessionData = await apiService.getSession(room.id);
        setSession(sessionData);
      }
    } catch (error) {
      console.error('Failed to load room data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkNumber = async (cardId: string, row: number, col: number) => {
    try {
      await apiService.markNumber(session?.id || '', {
        card_id: cardId,
        row,
        col,
      });
      
      // Update local state
      setCards(prev => prev.map(card => 
        card.id === cardId 
          ? {
              ...card,
              marked: card.marked.map((r, rIndex) =>
                rIndex === row 
                  ? r.map((c, cIndex) => cIndex === col ? true : c)
                  : r
              )
            }
          : card
      ));
    } catch (error) {
      console.error('Failed to mark number:', error);
    }
  };

  const handleDrawNumber = async () => {
    if (!session) return;
    
    try {
      await apiService.drawNumber(session.id);
      // Reload session data
      const updatedSession = await apiService.getSession(session.id);
      setSession(updatedSession);
    } catch (error) {
      console.error('Failed to draw number:', error);
    }
  };

  const handleClaimBingo = async () => {
    if (!session) return;
    
    try {
      await apiService.claimBingo(session.id);
      // Reload session data
      const updatedSession = await apiService.getSession(session.id);
      setSession(updatedSession);
    } catch (error) {
      console.error('Failed to claim bingo:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 mr-4"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">{room.name}</h1>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Timer className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">{formatTime(gameTime)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">{players.length} players</span>
              </div>
              <div className="flex items-center space-x-2">
                <Trophy className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">${room.prize_pool}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Game Controls */}
          <div className="lg:col-span-1 space-y-6">
            <NumberCaller
              currentNumber={session?.current_number}
              calledNumbers={session?.called_numbers || []}
              onDrawNumber={handleDrawNumber}
              isGameActive={room.status === 'active'}
            />
            
            {/* Bingo Button */}
            <button
              onClick={handleClaimBingo}
              disabled={room.status !== 'active'}
              className={`
                w-full py-4 px-6 rounded-xl font-bold text-xl transition-all duration-300 transform
                ${room.status === 'active'
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 hover:scale-105 shadow-lg animate-pulse'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              BINGO!
            </button>

            {/* Players List */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Players</h3>
              <div className="space-y-3">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      player.is_winner ? 'bg-gold-100 border border-gold-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        player.is_winner ? 'bg-gold-500' : 'bg-purple-500'
                      }`}>
                        {player.first_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{player.first_name}</div>
                        <div className="text-xs text-gray-500">{player.cards_count} cards</div>
                      </div>
                    </div>
                    {player.is_winner && (
                      <Trophy className="h-5 w-5 text-gold-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bingo Cards */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cards.map((card) => (
                <BingoCard
                  key={card.id}
                  card={card}
                  calledNumbers={session?.called_numbers || []}
                  onMarkNumber={(row, col) => handleMarkNumber(card.id, row, col)}
                  isInteractive={room.status === 'active'}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
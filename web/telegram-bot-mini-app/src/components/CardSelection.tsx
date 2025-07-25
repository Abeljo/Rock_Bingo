import  { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { apiService } from '../services/api';
import { BingoCard } from './BingoCard';

interface CardSelectionProps {
  roomId: string;
  userId: number;
  onCardSelected: (cardNumber: number) => void;
  onBack: () => void;
  disabledCardNumbers?: number[];
  countdown?: { time_left: number; is_active: boolean };
  onCountdownEnd?: () => void;
  selectedCard?: any;
  onCardSelectedWithData?: (cardData: any) => void; // NEW PROP
}

interface AvailableCard {
  id: number;
  room_id: number;
  card_number: number;
  card_data: any;
  is_selected: boolean;
  selected_by_user_id?: number;
}

// Format seconds into mm:ss
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export function CardSelection({
  roomId,
  onCardSelected,
  onBack,
  disabledCardNumbers = [],
  countdown,
  onCountdownEnd,
  selectedCard,
  onCardSelectedWithData,
}: CardSelectionProps) {
  const [availableCards, setAvailableCards] = useState<AvailableCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCardNumber, setSelectedCardNumber] = useState<number | null>(null);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    loadAvailableCards();
  }, [roomId]);

  // Auto-transition when countdown reaches 5 seconds
  useEffect(() => {
    if (countdown && countdown.is_active && countdown.time_left <= 5 && onCountdownEnd) {
      onCountdownEnd();
    }
  }, [countdown, onCountdownEnd]);

  // Debug: log countdown prop
  useEffect(() => {
    console.log('[CardSelection] Countdown prop:', countdown);
  }, [countdown]);

  const loadAvailableCards = async () => {
    try {
      setLoading(true);
      const cards = await apiService.getAvailableCards(roomId);
      setAvailableCards(cards || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load available cards');
    } finally {
      setLoading(false);
    }
  };

  const handleCardSelect = async (cardNumber: number) => {
    if (selecting) return;

    try {
      setSelecting(true);
      await apiService.selectCard(roomId, cardNumber);
      setSelectedCardNumber(cardNumber);
      onCardSelected(cardNumber);
      // NEW: Fetch full card data and call onCardSelectedWithData
      if (onCardSelectedWithData) {
        const cardData = await apiService.getMyCard(roomId);
        if (cardData) {
          onCardSelectedWithData(cardData);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to select card');
    } finally {
      setSelecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading available cards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="text-red-500 mb-4">
            <X className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadAvailableCards}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const isCardSelectionDisabled = countdown && countdown.is_active && countdown.time_left <= 3;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Enhanced prominent countdown at the top */}
      {countdown && countdown.is_active && (
        <div
          className="w-full flex flex-col items-center justify-center py-4 bg-gradient-to-r from-blue-100 to-purple-100 border-b-2 border-purple-300 shadow-md mb-4"
          aria-live="assertive"
          aria-atomic="true"
          role="timer"
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl md:text-5xl font-extrabold text-purple-700 animate-pulse tabular-nums">
              {formatTime(countdown.time_left)}
            </span>
            <span className="text-lg md:text-2xl font-semibold text-gray-700">remaining</span>
          </div>
          <div className="text-md md:text-lg text-purple-700 font-bold mt-2 animate-fade-in">
            Game will start soon!
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Go back"
            >
              <X className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Select Your Bingo Card</h1>
            <div className="w-10"></div> {/* Spacer */}
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="mb-6">
          <p className="text-gray-600 text-center mb-4">
            Choose one of the 100 available bingo cards. Each card has 25 unique numbers from 1-100.
          </p>
          <div className="text-center">
            <span className="text-sm text-gray-500">
              Available: {availableCards?.filter(c => !c.is_selected).length || 0} |{' '}
              Selected: {availableCards?.filter(c => c.is_selected).length || 0}
            </span>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-10 gap-2 md:gap-3">
          {availableCards?.map((card) => (
            <button
              key={card.id}
              onClick={() =>
                !card.is_selected &&
                !disabledCardNumbers.includes(card.card_number) &&
                !isCardSelectionDisabled &&
                handleCardSelect(card.card_number)
              }
              disabled={
                card.is_selected || selecting || disabledCardNumbers.includes(card.card_number) || isCardSelectionDisabled
              }
              className={`
                aspect-square rounded-lg border-2 font-bold text-sm transition-all duration-200
                ${
                  card.is_selected || disabledCardNumbers.includes(card.card_number)
                    ? 'bg-green-100 border-green-500 text-green-700'
                    : isCardSelectionDisabled
                    ? 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed'
                    : 'bg-white border-gray-300 hover:border-purple-500 hover:bg-purple-50 text-gray-700'
                }
                ${selecting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              aria-pressed={card.is_selected}
              aria-label={`Bingo card number ${card.card_number}${card.is_selected ? ', selected' : ''}`}
            >
              <div className="flex items-center justify-center h-full">
                {card.is_selected || disabledCardNumbers.includes(card.card_number) ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{card.card_number}</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Selected Card Info */}
        {selectedCardNumber && (
          <div className="mt-6 text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-green-800 font-semibold">Card #{selectedCardNumber} selected!</p>
              <p className="text-green-600 text-sm mt-1">You can now play the game with this card.</p>
            </div>
          </div>
        )}
      </div>
      {/* Mini Card Preview at the bottom */}
      {selectedCard && selectedCard.card_data && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-white rounded-lg shadow-lg p-2 border border-purple-200">
            <BingoCard cardData={selectedCard.card_data} cardNumber={selectedCard.card_number ?? Number(selectedCard.id)} disabled={true} />
          </div>
        </div>
      )}
    </div>
  );
}

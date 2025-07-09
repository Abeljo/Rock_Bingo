import React, { useEffect, useState } from 'react';

interface GameRoomFlowProps {
  apiUser: {
    id: number;
    telegram_id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
  betAmount: number;
}

type Step = 'room' | 'card' | 'countdown' | 'game' | 'bingo' | 'done';

interface Room {
  id: number;
  bet_amount: number;
  max_players: number;
  current_players: number;
  status: string;
}

interface Card {
  id: number;
  user_id: number;
  room_id: number;
  card_data: any; // JSONB, can be improved
  is_winner: boolean;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const GameRoomFlow: React.FC<GameRoomFlowProps> = ({ apiUser, betAmount }) => {
  const [step, setStep] = useState<Step>('room');
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(25);
  const [session, setSession] = useState<any>(null);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [markedNumbers, setMarkedNumbers] = useState<number[]>([]);
  const [canClaimBingo, setCanClaimBingo] = useState(false);
  const [bingoStatus, setBingoStatus] = useState<string | null>(null);
  const [winnings, setWinnings] = useState<number | null>(null);

  // Step 1: Create/join room
  useEffect(() => {
    if (step === 'room') {
      fetch(`${API_BASE}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': String(apiUser.id),
        },
        body: JSON.stringify({ bet_amount: betAmount, max_players: 10 }),
      })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to create room');
          return res.json();
        })
        .then((data) => {
          setRoom(data);
          setStep('card');
        })
        .catch((err) => {
          setError('Could not create or join room.');
        });
    }
    // eslint-disable-next-line
  }, [step, apiUser, betAmount]);

  // Step 2: Fetch available cards for the room
  useEffect(() => {
    if (step === 'card' && room) {
      setLoading(true);
      fetch(`${API_BASE}/api/rooms/${room.id}/cards`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': String(apiUser.id),
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch cards');
          return res.json();
        })
        .then((data) => {
          setCards(data);
          setLoading(false);
        })
        .catch((err) => {
          setError('Could not fetch available cards.');
          setLoading(false);
        });
    }
  }, [step, room, apiUser.id]);

  // Step 2b: Place bet (select card)
  const handleSelectCard = (card: Card) => {
    setLoading(true);
    fetch(`${API_BASE}/api/rooms/${room!.id}/bet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': String(apiUser.id),
      },
      body: JSON.stringify({ bingo_card_id: card.id, bet_amount: betAmount }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to place bet');
        setSelectedCard(card);
        setLoading(false);
        setStep('countdown');
      })
      .catch((err) => {
        setError('Could not place bet.');
        setLoading(false);
      });
  };

  // Start countdown after card selection
  useEffect(() => {
    if (step === 'countdown') {
      setCountdown(25);
      const interval = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(interval);
            setStep('game');
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Step 3: Start game session and poll for drawn numbers
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    if (step === 'game' && room && selectedCard) {
      // Fetch session info (assume one session per room)
      fetch(`${API_BASE}/api/rooms/${room.id}/session`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': String(apiUser.id),
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setSession(data);
        });
      // Poll for drawn numbers every 2s
      pollInterval = setInterval(() => {
        fetch(`${API_BASE}/api/session/${room.id}/drawn`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': String(apiUser.id),
          },
        })
          .then((res) => res.json())
          .then((data) => {
            setDrawnNumbers(data.numbers || []);
          });
      }, 2000);
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [step, room, selectedCard, apiUser.id]);

  // Mark number on card
  const handleMarkNumber = (num: number) => {
    if (!drawnNumbers.includes(num) || markedNumbers.includes(num)) return;
    setMarkedNumbers((prev) => [...prev, num]);
    // Optionally, call API to mark number
    fetch(`${API_BASE}/api/session/${room!.id}/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': String(apiUser.id),
      },
      body: JSON.stringify({ card_id: selectedCard!.id, number: num }),
    });
    // Check for bingo (simple: all numbers marked)
    if (selectedCard && selectedCard.card_data && selectedCard.card_data.numbers) {
      const allMarked = selectedCard.card_data.numbers.every((n: number) => markedNumbers.includes(n) || n === num);
      setCanClaimBingo(allMarked);
    }
  };

  // Claim bingo (updated to handle winnings)
  const handleClaimBingo = () => {
    setBingoStatus('claiming');
    fetch(`${API_BASE}/api/session/${room!.id}/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': String(apiUser.id),
      },
      body: JSON.stringify({ card_id: selectedCard!.id }),
    })
      .then((res) => res.json())
      .then((data) => {
        setBingoStatus(data.success ? 'success' : 'fail');
        setWinnings(data.winnings || 0);
        setStep('done');
      })
      .catch(() => {
        setBingoStatus('fail');
        setWinnings(0);
        setStep('done');
      });
  };

  // Play again handler
  const handlePlayAgain = () => {
    setStep('room');
    setRoom(null);
    setCards([]);
    setSelectedCard(null);
    setCountdown(25);
    setSession(null);
    setDrawnNumbers([]);
    setMarkedNumbers([]);
    setCanClaimBingo(false);
    setBingoStatus(null);
    setWinnings(null);
    setError(null);
    setLoading(false);
  };

  if (error) {
    return <div className="text-center text-red-400">{error}</div>;
  }
  if (step === 'room') {
    return <div className="text-center">Creating or joining room for {betAmount} ETB...</div>;
  }
  if (step === 'card') {
    return (
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-2">Select Your Bingo Card</h3>
        {loading && <div>Loading cards...</div>}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {cards.map((card) => (
            <button
              key={card.id}
              className={`p-4 rounded-lg border-2 border-brand-orange bg-brand-white/10 text-brand-white hover:bg-brand-orange/30 transition-all ${selectedCard?.id === card.id ? 'ring-2 ring-brand-green' : ''}`}
              onClick={() => handleSelectCard(card)}
              disabled={loading}
            >
              Card #{card.id}
            </button>
          ))}
        </div>
        {cards.length === 0 && !loading && <div>No available cards. Please wait...</div>}
      </div>
    );
  }
  if (step === 'countdown') {
    return (
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-2">Game starting soon...</h3>
        <div className="w-full max-w-xs bg-brand-white/20 rounded-full h-4 mb-2 overflow-hidden">
          <div
            className="bg-brand-orange h-4 transition-all"
            style={{ width: `${(countdown / 25) * 100}%` }}
          />
        </div>
        <div className="text-2xl font-bold text-brand-orange">{countdown}s</div>
        <div className="mt-2 text-sm text-brand-white/70">Get ready! The game will begin automatically.</div>
      </div>
    );
  }
  if (step === 'game' && selectedCard) {
    const numbers = selectedCard.card_data?.numbers || [];
    return (
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-2">Your Bingo Card</h3>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {numbers.map((num: number, idx: number) => (
            <button
              key={idx}
              className={`w-12 h-12 flex items-center justify-center rounded-lg border-2 text-lg font-bold transition-all
                ${markedNumbers.includes(num) ? 'bg-brand-green border-brand-green text-brand-white' :
                  drawnNumbers.includes(num) ? 'bg-brand-orange border-brand-orange text-brand-white' :
                  'bg-brand-white/10 border-brand-white/30 text-brand-white'}
              `}
              onClick={() => handleMarkNumber(num)}
              disabled={!drawnNumbers.includes(num) || markedNumbers.includes(num)}
            >
              {num}
            </button>
          ))}
        </div>
        <div className="mb-2 text-sm text-brand-white/80">Drawn numbers: {drawnNumbers.join(', ')}</div>
        <button
          className="mt-4 px-6 py-2 rounded bg-brand-orange text-brand-white font-semibold disabled:opacity-50"
          onClick={handleClaimBingo}
          disabled={!canClaimBingo || bingoStatus === 'claiming'}
        >
          {bingoStatus === 'claiming' ? 'Claiming...' : 'Claim Bingo!'}
        </button>
      </div>
    );
  }
  if (step === 'bingo') {
    return <div className="text-center">You can now claim Bingo! (UI coming soon)</div>;
  }
  if (step === 'done') {
    return (
      <div className="flex flex-col items-center">
        <h3 className="text-2xl font-bold mb-2 text-brand-orange">
          {bingoStatus === 'success' && winnings && winnings > 0
            ? '🎉 Bingo! You Won!'
            : bingoStatus === 'success'
            ? 'Bingo!'
            : 'Game Over'}
        </h3>
        {bingoStatus === 'success' && winnings && winnings > 0 && (
          <div className="text-lg mb-2 text-brand-green">You won {winnings} ETB!</div>
        )}
        {bingoStatus === 'fail' && (
          <div className="text-lg mb-2 text-red-400">Sorry, you did not win this time.</div>
        )}
        <button
          className="mt-4 px-6 py-2 rounded bg-brand-orange text-brand-white font-semibold"
          onClick={handlePlayAgain}
        >
          Play Again
        </button>
      </div>
    );
  }
  return null;
};

export default GameRoomFlow; 
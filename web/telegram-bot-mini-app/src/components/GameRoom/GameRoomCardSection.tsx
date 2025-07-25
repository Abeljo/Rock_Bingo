import { BingoCard } from '../BingoCard';
import { BingoCard as BingoCardType } from '../../types';

interface GameRoomCardSectionProps {
  selectedCard: BingoCardType | null;
  session: {
    status: string;
  } | null;
  handleMarkNumber: (number: number) => void;
}

export function GameRoomCardSection({
  selectedCard,
  session,
  handleMarkNumber,
}: GameRoomCardSectionProps) {
  if (!selectedCard) return null;

  const isCardDataValid =
    selectedCard.card_data &&
    Array.isArray(selectedCard.card_data.grid) &&
    selectedCard.card_data.grid.length > 0;

  return (
    <>
      {isCardDataValid ? (
        <BingoCard
          cardData={selectedCard.card_data}
          cardNumber={Number(selectedCard.id)}
          onNumberClick={handleMarkNumber}
          disabled={!session || session.status !== 'active'}
        />
      ) : (
        <div className="text-center text-red-500 font-semibold mt-4">
          Card data is missing or invalid. Please select another card.
        </div>
      )}

      <div className="mt-2 text-center text-gray-600 text-sm">
        Your Card: #{selectedCard.id}
      </div>
    </>
  );
}

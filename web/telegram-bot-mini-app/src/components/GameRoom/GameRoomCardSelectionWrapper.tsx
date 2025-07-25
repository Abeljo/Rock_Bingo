import React from 'react';
import { CardSelection } from '../CardSelection';
import { Countdown } from '../Countdown';
import { Loader } from 'lucide-react';

interface GameRoomCardSelectionWrapperProps {
  showCardSelection: boolean;
  forceCardSelection: boolean;
  session: {
    status: string;
    room_id?: string;
  } | null;
  selectedCard: any;
  disabledCardNumbers: number[];
  countdown: {
    time_left: number;
    is_active: boolean;
  } | null;
  handleCardSelected: (cardNumber: number) => void;
  onBack: () => void;
  dispatch: React.Dispatch<any>;
  userId: number;
}

export function GameRoomCardSelectionWrapper({
  showCardSelection,
  forceCardSelection,
  session,
  selectedCard,
  disabledCardNumbers,
  countdown,
  handleCardSelected,
  onBack,
  dispatch,
  userId,
}: GameRoomCardSelectionWrapperProps) {
  const shouldShowSelection =
    showCardSelection || forceCardSelection || (!selectedCard && session?.status === 'active');

  if (!shouldShowSelection) return null;

  const gameInProgressWithoutCard = session?.status === 'active' && !selectedCard;

  return (
    <div>
      {countdown && (
        <div className="w-full flex justify-center mb-4">
          <Countdown
            timeLeft={countdown.time_left}
            isActive={countdown.is_active}
            onGameStart={() => {}}
          />
        </div>
      )}

      {gameInProgressWithoutCard ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader className="h-16 w-16 text-yellow-500 animate-spin mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Game In Progress</h2>
          <p className="text-gray-600">
            You did not select a card in time. Please wait for the next game to join.
          </p>
        </div>
      ) : (
        <CardSelection
          roomId={session?.room_id ?? ''}
          onCardSelected={handleCardSelected}
          onCardSelectedWithData={(card) =>
            dispatch({ type: 'SET_SELECTED_CARD', payload: card })
          }
          onBack={onBack}
          disabledCardNumbers={disabledCardNumbers}
          countdown={countdown ?? undefined}
          selectedCard={selectedCard}
          onCountdownEnd={() =>
            dispatch({ type: 'SET_SHOW_CARD_SELECTION', payload: false })
          }
          userId={userId}
        />
      )}
    </div>
  );
}

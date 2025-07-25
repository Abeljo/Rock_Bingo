
import { X, Sparkles } from 'lucide-react';

interface GameRoomModalsProps {
  uncalledModalOpen: boolean;
  uncalledModalMsg?: string;
  showCongratsModal: boolean;
  winningAmount: number | null;
  handleSelectAnotherCard: () => void;
  handleLeaveRoom: () => void;
  showGameOverModal: boolean;
  setShowGameOverModal: (value: boolean) => void;
  onBack: () => void;
}

export function GameRoomModals({
  uncalledModalOpen,
  uncalledModalMsg = 'Uncalled numbers present!',
  showCongratsModal,
  winningAmount,
  handleSelectAnotherCard,
  handleLeaveRoom,
  showGameOverModal,
  setShowGameOverModal,
  onBack,
}: GameRoomModalsProps) {
  return (
    <>
      {/* Uncalled Numbers Toast */}
      {uncalledModalOpen && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl px-6 py-3 max-w-xs w-full text-center border border-red-200 animate-fade-in">
            <div className="text-red-600 font-semibold mb-1 flex items-center justify-center">
              <X className="h-5 w-5 mr-2" />
              {uncalledModalMsg}
            </div>
          </div>
        </div>
      )}

      {/* Congrats Modal */}
      {showCongratsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full text-center animate-fade-in">
            <Sparkles className="h-12 w-12 text-yellow-500 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold text-green-700 mb-2">Congratulations!</h2>
            <p className="text-lg text-gray-800 mb-2">You won the game!</p>
            {winningAmount !== null && (
              <p className="text-xl font-bold text-purple-700 mb-4">+{winningAmount.toFixed(2)} ETB</p>
            )}
            <div className="flex flex-col gap-3 mt-4">
              <button
                onClick={handleSelectAnotherCard}
                className="w-full px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-bold shadow hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
              >
                Select Another Card
              </button>
              <button
                onClick={handleLeaveRoom}
                className="w-full px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-bold shadow hover:bg-gray-300 transition-all duration-200"
              >
                Leave Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {showGameOverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full text-center animate-fade-in">
            <X className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Game Over</h2>
            <p className="text-lg text-gray-800 mb-4">Better luck next time!</p>
            <button
              onClick={() => {
                setShowGameOverModal(false);
                onBack();
              }}
              className="w-full px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-bold shadow hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
            >
              Return to Lobby
            </button>
          </div>
        </div>
      )}
    </>
  );
}

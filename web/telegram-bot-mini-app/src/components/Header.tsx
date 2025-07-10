import React from 'react';
import { User, Crown, Wallet, Menu } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram';

interface HeaderProps {
  balance: any;
  onProfileClick: () => void;
  onWalletClick: () => void;
  onMenuClick: () => void;
}

export function Header({ balance, onProfileClick, onWalletClick, onMenuClick }: HeaderProps) {
  const { user } = useTelegram();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Crown className="h-8 w-8 text-purple-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">BingoMaster</h1>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onWalletClick}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-full hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-lg"
            >
              <Wallet className="h-4 w-4" />
              <span className="font-semibold">
                ${
                  balance && (balance as any).Balance !== undefined && (balance as any).Balance !== null
                    ? (balance as any).Balance.toFixed(2)
                    : '0.00'
                }
              </span>
            </button>

            <button
              onClick={onProfileClick}
              className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 transition-colors duration-200 px-3 py-2 rounded-full"
            >
              <User className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {user?.first_name || 'Guest'}
              </span>
            </button>

            <button
              onClick={onMenuClick}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
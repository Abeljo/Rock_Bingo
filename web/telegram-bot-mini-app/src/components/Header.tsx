import React from 'react';
import { User, Crown, Wallet as WalletIcon, Menu, User as UserIcon } from 'lucide-react';

interface HeaderProps {
  balance: number;
  onProfileClick: () => void;
  onWalletClick: () => void;
  onMenuClick: () => void;
  userName?: string;
}

export function Header({ balance, onProfileClick, onWalletClick, onMenuClick, userName }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">Rock Bingo</h1>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onWalletClick}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-full hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-lg"
            >
              <WalletIcon className="h-4 w-4" />
              <span className="font-semibold">
                ${balance !== undefined && balance !== null ? balance.toFixed(2) : '0.00'}
              </span>
            </button>

            <button
              onClick={onProfileClick}
              className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 transition-colors duration-200 px-3 py-2 rounded-full"
            >
              <UserIcon className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {userName || 'Guest'}
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
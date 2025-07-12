import React from 'react';
import { X, Home, Trophy, HelpCircle, Info, Settings, Shield } from 'lucide-react';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

export function MenuModal({ isOpen, onClose, onNavigate }: MenuModalProps) {
  if (!isOpen) return null;

  const menuItems = [
    {
      icon: Home,
      label: 'Home',
      description: 'Return to lobby',
      action: () => onNavigate('home'),
      color: 'text-blue-600'
    },
    {
      icon: Trophy,
      label: 'Leaderboard',
      description: 'View top players',
      action: () => onNavigate('leaderboard'),
      color: 'text-yellow-600'
    },
    {
      icon: HelpCircle,
      label: 'How to Play',
      description: 'Learn the rules',
      action: () => onNavigate('help'),
      color: 'text-green-600'
    },
    {
      icon: Info,
      label: 'About',
      description: 'App information',
      action: () => onNavigate('about'),
      color: 'text-purple-600'
    },
    {
      icon: Settings,
      label: 'Settings',
      description: 'App preferences',
      action: () => onNavigate('settings'),
      color: 'text-gray-600'
    },
    {
      icon: Shield,
      label: 'Privacy',
      description: 'Privacy policy',
      action: () => onNavigate('privacy'),
      color: 'text-red-600'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Menu</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-2">
            {menuItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={index}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  className="w-full flex items-center space-x-4 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors group"
                >
                  <div className={`p-2 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors`}>
                    <IconComponent className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.label}</div>
                    <div className="text-sm text-gray-500">{item.description}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* App Version */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-400">Rock Bingo v1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
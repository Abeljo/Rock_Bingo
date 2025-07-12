import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import { Wallet, Transaction } from '../types';
import { apiService } from '../services/api';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBalanceUpdate: (newBalance: number) => void;
  userId: string;
}

export function WalletModal({ isOpen, onClose, onBalanceUpdate, userId }: WalletModalProps) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw' | 'history'>('overview');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletError, setWalletError] = useState<any>(null);

  useEffect(() => {
    if (isOpen && userId) {
      loadWalletData();
    }
  }, [isOpen, userId]);

  const loadWalletData = async () => {
    try {
      const [walletData, transactionData] = await Promise.all([
        apiService.getWallet(userId),
        apiService.getTransactions(userId),
      ]);
      setWallet(walletData);
      setTransactions(transactionData);
      setWalletError(null);
      onBalanceUpdate(walletData?.balance ?? 0);
    } catch (error) {
      setWalletError(error);
    }
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    setLoading(true);
    try {
      const depositPayload = {
        amount: parseFloat(amount),
        currency: 'USD',
        transaction_ref: `webapp-${userId}-${Date.now()}`,
        status: 'completed',
      };
      console.log('Deposit payload:', depositPayload);
      console.log('X-User-ID:', userId);
      await apiService.deposit(userId, depositPayload);
      await loadWalletData();
      setAmount('');
      setActiveTab('overview');
    } catch (error) {
      console.error('Deposit failed:', error);
      // Show error to user
      const errorMessage = error instanceof Error ? error.message : 'Deposit failed. Please try again.';
      alert(`Deposit failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0 || parseFloat(amount) > (wallet?.balance || 0)) return;
    
    setLoading(true);
    try {
      const withdrawPayload = {
        amount: parseFloat(amount),
        currency: 'USD',
        destination: 'user_wallet',
      };
      console.log('Withdraw payload:', withdrawPayload);
      await apiService.withdraw(userId, withdrawPayload);
      await loadWalletData();
      setAmount('');
      setActiveTab('overview');
    } catch (error) {
      console.error('Withdraw failed:', error);
      // Show error to user
      const errorMessage = error instanceof Error ? error.message : 'Withdraw failed. Please try again.';
      alert(`Withdraw failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'withdraw':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'bet':
        return <Minus className="h-4 w-4 text-red-500" />;
      case 'win':
        return <Plus className="h-4 w-4 text-green-500" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'win':
        return 'text-green-600';
      case 'withdraw':
      case 'bet':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!isOpen) return null;
  if (!userId) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col items-center justify-center p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">User not authenticated</h2>
          <p className="text-gray-700">Please wait for authentication to complete or try reloading the app.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Wallet</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'deposit', label: 'Deposit' },
            { id: 'withdraw', label: 'Withdraw' },
            { id: 'history', label: 'History' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Current Balance</p>
                    <p className="text-3xl font-bold">
                      ${wallet && wallet.balance !== undefined && wallet.balance !== null
                        ? wallet.balance.toFixed(2)
                        : '0.00'}
                    </p>
                  </div>
                  <CreditCard className="h-8 w-8 text-purple-200" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('deposit')}
                  className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 text-center transition-colors duration-200"
                >
                  <Plus className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-600">Deposit Funds</p>
                </button>
                <button
                  onClick={() => setActiveTab('withdraw')}
                  className="bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg p-4 text-center transition-colors duration-200"
                >
                  <Minus className="h-6 w-6 text-red-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-red-600">Withdraw Funds</p>
                </button>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((transaction: any) => {
                    const getTransactionDescription = (type: string) => {
                      switch (type) {
                        case 'deposit':
                          return 'Deposit';
                        case 'withdraw':
                          return 'Withdrawal';
                        case 'bet':
                          return 'Bet Placed';
                        case 'win':
                          return 'Bingo Win';
                        default:
                          return type.charAt(0).toUpperCase() + type.slice(1);
                      }
                    };
                    
                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {getTransactionIcon(transaction.type)}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {getTransactionDescription(transaction.type)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {transaction.created_at
                                ? new Date(transaction.created_at).toLocaleDateString()
                                : ''}
                            </p>
                          </div>
                        </div>
                        <p className={`text-sm font-semibold ${getTransactionColor(transaction.type)}`}>
                          {transaction.type === 'deposit' || transaction.type === 'win' ? '+' : '-'}
                          {transaction.amount !== undefined && transaction.amount !== null
                            ? transaction.amount.toFixed(2)
                            : '0.00'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'deposit' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Deposit Funds</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount ($)
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter amount"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 25, 50, 100].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setAmount(preset.toString())}
                        className="py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors duration-200"
                      >
                        ${preset}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={handleDeposit}
                    disabled={!amount || parseFloat(amount) <= 0 || loading}
                    className={`
                      w-full py-3 px-4 rounded-lg font-medium transition-all duration-200
                      ${amount && parseFloat(amount) > 0 && !loading
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }
                    `}
                  >
                    {loading ? 'Processing...' : 'Deposit'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'withdraw' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Withdraw Funds</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount ($)
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter amount"
                      min="0"
                      max={wallet?.balance || 0}
                      step="0.01"
                    />
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    Available balance: {(wallet && wallet.balance !== undefined && wallet.balance !== null) ? wallet.balance.toFixed(2) : '0.00'}
                  </p>
                  
                  <button
                    onClick={handleWithdraw}
                    disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > (wallet?.balance || 0) || loading}
                    className={`
                      w-full py-3 px-4 rounded-lg font-medium transition-all duration-200
                      ${amount && parseFloat(amount) > 0 && parseFloat(amount) <= (wallet?.balance || 0) && !loading
                        ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }
                    `}
                  >
                    {loading ? 'Processing...' : 'Withdraw'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h3>
                <div className="space-y-3">
                  {transactions.map((transaction: any) => {
                    const getTransactionDescription = (type: string) => {
                      switch (type) {
                        case 'deposit':
                          return 'Deposit';
                        case 'withdraw':
                          return 'Withdrawal';
                        case 'bet':
                          return 'Bet Placed';
                        case 'win':
                          return 'Bingo Win';
                        default:
                          return type.charAt(0).toUpperCase() + type.slice(1);
                      }
                    };
                    
                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {getTransactionIcon(transaction.type)}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {getTransactionDescription(transaction.type)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {transaction.created_at
                                ? new Date(transaction.created_at).toLocaleString()
                                : ''}
                            </p>
                          </div>
                        </div>
                        <p className={`text-sm font-semibold ${getTransactionColor(transaction.type)}`}>
                          {transaction.type === 'deposit' || transaction.type === 'win' ? '+' : '-'}
                          {transaction.amount !== undefined && transaction.amount !== null
                            ? transaction.amount.toFixed(2)
                            : '0.00'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
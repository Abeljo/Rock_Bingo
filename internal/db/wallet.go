package db

import (
	"context"

	"github.com/jmoiron/sqlx"
)

type WalletStore struct {
	DB *sqlx.DB
}

func NewWalletStore(db *sqlx.DB) *WalletStore {
	return &WalletStore{DB: db}
}

// Get wallet by user ID
func (s *WalletStore) GetWallet(ctx context.Context, userID int64) (*Wallet, error) {
	var wallet Wallet
	err := s.DB.GetContext(ctx, &wallet, `SELECT * FROM wallets WHERE user_id = $1`, userID)
	if err != nil {
		return nil, err
	}
	return &wallet, nil
}

// Get transactions by user ID
func (s *WalletStore) GetTransactions(ctx context.Context, userID int64) ([]Transaction, error) {
	var txs []Transaction
	err := s.DB.SelectContext(ctx, &txs, `SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC`, userID)
	return txs, err
}

// Create a deposit
func (s *WalletStore) CreateDeposit(ctx context.Context, userID int64, amount float64, currency, transactionRef, status string) (*PaymentDeposit, error) {
	var dep PaymentDeposit
	err := s.DB.GetContext(ctx, &dep, `
		INSERT INTO payment_deposits (user_id, amount, currency, transaction_ref, status)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING *
	`, userID, amount, currency, transactionRef, status)
	if err != nil {
		return nil, err
	}
	return &dep, nil
}

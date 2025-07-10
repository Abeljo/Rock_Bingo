package db

import (
	"time"
)

// Users table
type User struct {
	ID         int64     `db:"id"`
	TelegramID int64     `db:"telegram_id"`
	Username   string    `db:"username"`
	FirstName  string    `db:"first_name"`
	LastName   string    `db:"last_name"`
	CreatedAt  time.Time `db:"created_at"`
}

// BingoRooms table
//
//	type BingoRoom struct {
//		ID             int64     `db:"id"`
//		BetAmount      float64   `db:"bet_amount"`
//		CurrentPlayers int       `db:"current_players"`
//		MaxPlayers     int       `db:"max_players"`
//		Status         string    `db:"status"`
//		CreatedAt      time.Time `db:"created_at"`
//		UpdatedAt      time.Time `db:"updated_at"`
//	}
type BingoRoom struct {
	ID             int64     `db:"id" json:"id"`
	BetAmount      float64   `db:"bet_amount" json:"bet_amount"`
	CurrentPlayers int       `db:"current_players" json:"current_players"`
	MaxPlayers     int       `db:"max_players" json:"max_players"`
	Status         string    `db:"status" json:"status"`
	CreatedAt      time.Time `db:"created_at" json:"created_at"`
	UpdatedAt      time.Time `db:"updated_at" json:"updated_at"`
}

// BingoCards table
type BingoCard struct {
	ID        int64     `db:"id"`
	UserID    int64     `db:"user_id"`
	RoomID    int64     `db:"room_id"`
	CardData  []byte    `db:"card_data"` // JSONB
	IsWinner  bool      `db:"is_winner"`
	CreatedAt time.Time `db:"created_at"`
}

// GameSessions table
type GameSession struct {
	ID               int64     `db:"id"`
	RoomID           int64     `db:"room_id"`
	SessionStartTime time.Time `db:"session_start_time"`
	SessionEndTime   time.Time `db:"session_end_time"`
	Status           string    `db:"status"`
	CreatedAt        time.Time `db:"created_at"`
}

// GameNumbers table
type GameNumber struct {
	ID          int64     `db:"id"`
	SessionID   int64     `db:"session_id"`
	DrawnNumber int       `db:"drawn_number"`
	DrawnAt     time.Time `db:"drawn_at"`
}

// Winners table
type Winner struct {
	ID          int64     `db:"id"`
	SessionID   int64     `db:"session_id"`
	UserID      int64     `db:"user_id"`
	BingoCardID int64     `db:"bingo_card_id"`
	Winnings    float64   `db:"winnings"`
	WonAt       time.Time `db:"won_at"`
}

// UserBets table
type UserBet struct {
	ID          int64     `db:"id"`
	UserID      int64     `db:"user_id"`
	RoomID      int64     `db:"room_id"`
	BingoCardID int64     `db:"bingo_card_id"`
	BetAmount   float64   `db:"bet_amount"`
	CreatedAt   time.Time `db:"created_at"`
}

// Wallets table
type Wallet struct {
	ID        int64     `db:"id"`
	UserID    int64     `db:"user_id"`
	Balance   float64   `db:"balance"`
	CreatedAt time.Time `db:"created_at"`
	UpdatedAt time.Time `db:"updated_at"`
}

// Transactions table
type Transaction struct {
	ID        int64     `db:"id"`
	UserID    int64     `db:"user_id"`
	Type      string    `db:"type"`
	Amount    float64   `db:"amount"`
	CreatedAt time.Time `db:"created_at"`
}

// PaymentDeposits table
type PaymentDeposit struct {
	ID             int64     `db:"id"`
	UserID         int64     `db:"user_id"`
	Amount         float64   `db:"amount"`
	Currency       string    `db:"currency"`
	TransactionRef string    `db:"transaction_ref"`
	Status         string    `db:"status"`
	CreatedAt      time.Time `db:"created_at"`
	UpdatedAt      time.Time `db:"updated_at"`
}

// AuditLogs table
type AuditLog struct {
	ID        int64     `db:"id"`
	UserID    int64     `db:"user_id"`
	Action    string    `db:"action"`
	Details   []byte    `db:"details"` // JSONB
	CreatedAt time.Time `db:"created_at"`
}

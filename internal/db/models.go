package db

import (
	"encoding/json"
	"time"
)

// Users table
type User struct {
	ID         int64     `db:"id"         json:"id"`
	TelegramID int64     `db:"telegram_id" json:"telegram_id"`
	Username   string    `db:"username"    json:"username"`
	FirstName  string    `db:"first_name"  json:"first_name"`
	LastName   string    `db:"last_name"   json:"last_name"`
	CreatedAt  time.Time `db:"created_at"  json:"created_at"`
}

// BingoRooms table
type BingoRoom struct {
	ID             int64      `db:"id"              json:"id"`
	BetAmount      float64    `db:"bet_amount"      json:"bet_amount"`
	CurrentPlayers int        `db:"current_players" json:"current_players"`
	MaxPlayers     int        `db:"max_players"     json:"max_players"`
	Status         string     `db:"status"          json:"status"`
	CountdownStart *time.Time `db:"countdown_start" json:"countdown_start"`
	GameStartTime  *time.Time `db:"game_start_time" json:"game_start_time"`
	CreatedAt      time.Time  `db:"created_at"      json:"created_at"`
	UpdatedAt      time.Time  `db:"updated_at"      json:"updated_at"`
}

// CountdownInfo represents countdown information for a room
type CountdownInfo struct {
	IsActive      bool       `json:"is_active"`
	TimeLeft      int        `json:"time_left"`
	GameStarted   bool       `json:"game_started"`
	GameStartTime *time.Time `json:"game_start_time"`
}

// BingoCards table
type BingoCard struct {
	ID        int64           `db:"id"          json:"id"`
	UserID    int64           `db:"user_id"     json:"user_id"`
	RoomID    int64           `db:"room_id"     json:"room_id"`
	CardData  json.RawMessage `db:"card_data"   json:"card_data"`
	IsWinner  bool            `db:"is_winner"   json:"is_winner"`
	CreatedAt time.Time       `db:"created_at"  json:"created_at"`
}

// AvailableCards table
type AvailableCard struct {
	ID               int64           `db:"id"                    json:"id"`
	RoomID           int64           `db:"room_id"               json:"room_id"`
	CardNumber       int             `db:"card_number"           json:"card_number"`
	CardData         json.RawMessage `db:"card_data"             json:"card_data"`
	IsSelected       bool            `db:"is_selected"           json:"is_selected"`
	SelectedByUserID *int64          `db:"selected_by_user_id"   json:"selected_by_user_id"`
	CreatedAt        time.Time       `db:"created_at"            json:"created_at"`
}

// GameSessions table
type GameSession struct {
	ID               int64           `db:"id"                  json:"id"`
	RoomID           int64           `db:"room_id"             json:"room_id"`
	SessionStartTime time.Time       `db:"session_start_time"  json:"session_start_time"`
	SessionEndTime   *time.Time      `db:"session_end_time"    json:"session_end_time"`
	Status           string          `db:"status"              json:"status"`
	DrawnNumbers     json.RawMessage `db:"drawn_numbers"       json:"drawn_numbers"`
	RemainingNumbers json.RawMessage `db:"remaining_numbers"   json:"remaining_numbers"`
	CreatedAt        time.Time       `db:"created_at"          json:"created_at"`
}

// GameNumbers table
type GameNumber struct {
	ID          int64     `db:"id"           json:"id"`
	SessionID   int64     `db:"session_id"   json:"session_id"`
	DrawnNumber int       `db:"drawn_number" json:"drawn_number"`
	DrawnAt     time.Time `db:"drawn_at"     json:"drawn_at"`
}

// Winners table
type Winner struct {
	ID          int64     `db:"id"            json:"id"`
	SessionID   int64     `db:"session_id"    json:"session_id"`
	UserID      int64     `db:"user_id"       json:"user_id"`
	BingoCardID int64     `db:"bingo_card_id" json:"bingo_card_id"`
	Winnings    float64   `db:"winnings"      json:"winnings"`
	WonAt       time.Time `db:"won_at"        json:"won_at"`
}

// UserBets table
type UserBet struct {
	ID          int64     `db:"id"            json:"id"`
	UserID      int64     `db:"user_id"       json:"user_id"`
	RoomID      int64     `db:"room_id"       json:"room_id"`
	BingoCardID int64     `db:"bingo_card_id" json:"bingo_card_id"`
	BetAmount   float64   `db:"bet_amount"    json:"bet_amount"`
	CreatedAt   time.Time `db:"created_at"    json:"created_at"`
}

// Wallets table
type Wallet struct {
	ID        int64     `db:"id"         json:"id"`
	UserID    int64     `db:"user_id"    json:"user_id"`
	Balance   float64   `db:"balance"    json:"balance"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

// Transactions table
type Transaction struct {
	ID        int64     `db:"id"         json:"id"`
	UserID    int64     `db:"user_id"    json:"user_id"`
	Type      string    `db:"type"       json:"type"`
	Amount    float64   `db:"amount"     json:"amount"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

// PaymentDeposits table
type PaymentDeposit struct {
	ID             int64     `db:"id"              json:"id"`
	UserID         int64     `db:"user_id"         json:"user_id"`
	Amount         float64   `db:"amount"          json:"amount"`
	Currency       string    `db:"currency"        json:"currency"`
	TransactionRef string    `db:"transaction_ref" json:"transaction_ref"`
	Status         string    `db:"status"          json:"status"`
	CreatedAt      time.Time `db:"created_at"      json:"created_at"`
	UpdatedAt      time.Time `db:"updated_at"      json:"updated_at"`
}

// AuditLogs table
type AuditLog struct {
	ID        int64           `db:"id"         json:"id"`
	UserID    int64           `db:"user_id"    json:"user_id"`
	Action    string          `db:"action"     json:"action"`
	Details   json.RawMessage `db:"details"    json:"details"`
	CreatedAt time.Time       `db:"created_at" json:"created_at"`
}

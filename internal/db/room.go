package db

import (
	"context"

	"github.com/jmoiron/sqlx"
)

type RoomStore struct {
	DB *sqlx.DB
}

func NewRoomStore(db *sqlx.DB) *RoomStore {
	return &RoomStore{DB: db}
}

// Create a new room
func (s *RoomStore) CreateRoom(ctx context.Context, betAmount float64, maxPlayers int) (*BingoRoom, error) {
	var room BingoRoom
	err := s.DB.GetContext(ctx, &room, `
		INSERT INTO bingo_rooms (bet_amount, max_players, current_players, status)
		VALUES ($1, $2, 1, 'waiting')
		RETURNING *
	`, betAmount, maxPlayers)
	if err != nil {
		return nil, err
	}
	return &room, nil
}

// List all rooms
func (s *RoomStore) ListRooms(ctx context.Context) ([]BingoRoom, error) {
	var rooms []BingoRoom
	err := s.DB.SelectContext(ctx, &rooms, `SELECT * FROM bingo_rooms WHERE status IN ('waiting', 'active') ORDER BY created_at DESC`)
	return rooms, err
}

// Get room by ID
func (s *RoomStore) GetRoom(ctx context.Context, id int64) (*BingoRoom, error) {
	var room BingoRoom
	err := s.DB.GetContext(ctx, &room, `SELECT * FROM bingo_rooms WHERE id = $1`, id)
	if err != nil {
		return nil, err
	}
	return &room, nil
}

// Join a room (increment current_players)
func (s *RoomStore) JoinRoom(ctx context.Context, roomID int64) error {
	_, err := s.DB.ExecContext(ctx, `
		UPDATE bingo_rooms SET current_players = current_players + 1 WHERE id = $1 AND current_players < max_players
	`, roomID)
	return err
}

// Leave a room (decrement current_players)
func (s *RoomStore) LeaveRoom(ctx context.Context, roomID int64) error {
	_, err := s.DB.ExecContext(ctx, `
		UPDATE bingo_rooms SET current_players = GREATEST(current_players - 1, 0) WHERE id = $1
	`, roomID)
	return err
}

// Start a room (set status to 'active')
func (s *RoomStore) StartRoom(ctx context.Context, roomID int64) error {
	_, err := s.DB.ExecContext(ctx, `
		UPDATE bingo_rooms SET status = 'active' WHERE id = $1
	`, roomID)
	return err
}

// Get players in a room
func (s *RoomStore) GetRoomPlayers(ctx context.Context, roomID int64) ([]User, error) {
	var users []User
	err := s.DB.SelectContext(ctx, &users, `
		SELECT u.* FROM users u
		JOIN bingo_cards c ON c.user_id = u.id
		WHERE c.room_id = $1
	`, roomID)
	return users, err
}

// Get all cards in a room
func (s *RoomStore) GetRoomCards(ctx context.Context, roomID int64) ([]BingoCard, error) {
	var cards []BingoCard
	err := s.DB.SelectContext(ctx, &cards, `SELECT * FROM bingo_cards WHERE room_id = $1`, roomID)
	return cards, err
}

// Place a bet (insert into user_bets)
func (s *RoomStore) PlaceBet(ctx context.Context, userID, roomID, cardID int64, betAmount float64) error {
	_, err := s.DB.ExecContext(ctx, `
		INSERT INTO user_bets (user_id, room_id, bingo_card_id, bet_amount)
		VALUES ($1, $2, $3, $4)
	`, userID, roomID, cardID, betAmount)
	return err
}

// Find or create a room with the specified bet amount
func (s *RoomStore) FindOrCreateRoom(ctx context.Context, betAmount float64) (*BingoRoom, error) {
	// First, try to find an existing room with the same bet amount that has space
	var room BingoRoom
	err := s.DB.GetContext(ctx, &room, `
		SELECT * FROM bingo_rooms 
		WHERE bet_amount = $1 AND status = 'waiting' AND current_players < max_players 
		ORDER BY created_at ASC 
		LIMIT 1
	`, betAmount)
	
	if err == nil {
		// Found an existing room
		return &room, nil
	}
	
	// No existing room found, create a new one
	return s.CreateRoom(ctx, betAmount, 10) // Default max players of 10
}

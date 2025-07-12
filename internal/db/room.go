package db

import (
	"context"
	"fmt"
	"time"

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
		INSERT INTO bingo_rooms (bet_amount, max_players, current_players, status, countdown_start, game_start_time)
		VALUES ($1, $2, 0, 'waiting', NULL, NULL)
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

// Join a room (increment current_players and start countdown if first player)
func (s *RoomStore) JoinRoom(ctx context.Context, roomID int64) error {
	// First, get the current room state
	var room BingoRoom
	err := s.DB.GetContext(ctx, &room, `SELECT * FROM bingo_rooms WHERE id = $1`, roomID)
	if err != nil {
		return err
	}

	// If this is the first player joining, start the countdown
	if room.CurrentPlayers == 0 {
		now := time.Now()
		countdownStart := now
		gameStartTime := now.Add(60 * time.Second) // 60 second countdown

		_, err = s.DB.ExecContext(ctx, `
			UPDATE bingo_rooms 
			SET current_players = current_players + 1, 
				countdown_start = $1, 
				game_start_time = $2,
				updated_at = NOW()
			WHERE id = $3 AND current_players < max_players
		`, countdownStart, gameStartTime, roomID)
	} else {
		// Just increment player count
		_, err = s.DB.ExecContext(ctx, `
			UPDATE bingo_rooms 
			SET current_players = current_players + 1,
				updated_at = NOW()
			WHERE id = $1 AND current_players < max_players
		`, roomID)
	}
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
		SELECT DISTINCT u.* FROM users u
		JOIN available_cards ac ON ac.selected_by_user_id = u.id
		WHERE ac.room_id = $1 AND ac.is_selected = true
	`, roomID)

	fmt.Printf("GetRoomPlayers: roomID=%d, found %d players\n", roomID, len(users))
	for i, user := range users {
		fmt.Printf("  Player %d: ID=%d, Username=%s\n", i+1, user.ID, user.Username)
	}

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
	newRoom, err := s.CreateRoom(ctx, betAmount, 10) // Default max players of 10
	if err != nil {
		return nil, err
	}

	// Initialize available cards for the new room
	cardStore := &CardStore{DB: s.DB}
	err = cardStore.InitializeAvailableCards(ctx, newRoom.ID)
	if err != nil {
		return nil, err
	}

	return newRoom, nil
}

// Get countdown information for a room
func (s *RoomStore) GetCountdownInfo(ctx context.Context, roomID int64) (*CountdownInfo, error) {
	var room BingoRoom
	err := s.DB.GetContext(ctx, &room, `SELECT * FROM bingo_rooms WHERE id = $1`, roomID)
	if err != nil {
		return nil, err
	}

	if room.CountdownStart == nil || room.GameStartTime == nil {
		return &CountdownInfo{
			IsActive:    false,
			TimeLeft:    0,
			GameStarted: false,
		}, nil
	}

	now := time.Now()
	timeLeft := int(room.GameStartTime.Sub(now).Seconds())

	return &CountdownInfo{
		IsActive:      timeLeft > 0 && room.Status == "waiting",
		TimeLeft:      timeLeft,
		GameStarted:   now.After(*room.GameStartTime),
		GameStartTime: room.GameStartTime,
	}, nil
}

package db

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"math/rand"
	"rockbingo/internal/game"
	"time"

	"github.com/jmoiron/sqlx"
)

type SessionStore struct {
	DB *sqlx.DB
}

func NewSessionStore(db *sqlx.DB) *SessionStore {
	return &SessionStore{DB: db}
}

// Start a new game session
func (s *SessionStore) StartSession(ctx context.Context, roomID int64) (*GameSession, error) {
	callouts := game.GenerateCallouts()
	remaining, err := json.Marshal(callouts)
	if err != nil {
		return nil, err
	}
	drawn, err := json.Marshal([]int{})
	if err != nil {
		return nil, err
	}

	var session GameSession
	err = s.DB.GetContext(ctx, &session, `
		INSERT INTO game_sessions (room_id, session_start_time, status, drawn_numbers, remaining_numbers, created_at)
		VALUES ($1, $2, 'active', $3, $4, NOW())
		RETURNING *
	`, roomID, time.Now(), drawn, remaining)
	if err != nil {
		return nil, err
	}

	// Update room status to active
	_, err = s.DB.ExecContext(ctx, `
		UPDATE bingo_rooms SET status = 'active', updated_at = NOW() WHERE id = $1
	`, roomID)
	if err != nil {
		return nil, err
	}

	return &session, nil
}

// Get session by ID
func (s *SessionStore) GetSession(ctx context.Context, id int64) (*GameSession, error) {
	var session GameSession
	err := s.DB.GetContext(ctx, &session, `SELECT * FROM game_sessions WHERE id = $1`, id)
	if err != nil {
		return nil, err
	}
	return &session, nil
}

// Draw a number for a session
func (s *SessionStore) DrawNumber(ctx context.Context, sessionID int64) (int, error) {
	session, err := s.GetSession(ctx, sessionID)
	if err != nil {
		return 0, err
	}

	var remaining []int
	if err := json.Unmarshal(session.RemainingNumbers, &remaining); err != nil {
		return 0, err
	}
	if len(remaining) == 0 {
		return 0, errors.New("no numbers left to draw")
	}

	var drawn []int
	if err := json.Unmarshal(session.DrawnNumbers, &drawn); err != nil {
		return 0, err
	}

	// Draw a random number from remaining numbers
	randIndex := rand.Intn(len(remaining))
	drawnNumber := remaining[randIndex]
	// Remove the drawn number from remaining
	remaining = append(remaining[:randIndex], remaining[randIndex+1:]...)
	drawn = append(drawn, drawnNumber)

	// Marshal back to JSON
	newRemaining, err := json.Marshal(remaining)
	if err != nil {
		return 0, err
	}
	newDrawn, err := json.Marshal(drawn)
	if err != nil {
		return 0, err
	}

	// Update DB
	_, err = s.DB.ExecContext(ctx, `
		UPDATE game_sessions 
		SET drawn_numbers = $1, remaining_numbers = $2 
		WHERE id = $3
	`, newDrawn, newRemaining, sessionID)
	if err != nil {
		return 0, err
	}

	return drawnNumber, nil
}

// Mark a number on a user's selected card
func (s *SessionStore) MarkNumberOnCard(ctx context.Context, userID int64, cardNumber int, number int) error {
	var cardData []byte
	err := s.DB.GetContext(ctx, &cardData, `
		SELECT card_data FROM available_cards 
		WHERE selected_by_user_id = $1 AND card_number = $2
	`, userID, cardNumber)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("card not found or not selected by user")
		}
		return err
	}

	var card game.Card
	if err := json.Unmarshal(cardData, &card); err != nil {
		return err
	}

	card.MarkNumber(number)

	updatedCardData, err := json.Marshal(card)
	if err != nil {
		return err
	}

	_, err = s.DB.ExecContext(ctx, `
		UPDATE available_cards SET card_data = $1 
		WHERE selected_by_user_id = $2 AND card_number = $3
	`, updatedCardData, userID, cardNumber)
	return err
}

// Claim bingo and distribute winnings
func (s *SessionStore) ClaimBingo(ctx context.Context, userID int64, cardNumber int) error {
	fmt.Printf("ClaimBingo called: userID=%d, cardNumber=%d\n", userID, cardNumber)

	// Check if user has a wallet
	var walletExists bool
	err := s.DB.GetContext(ctx, &walletExists, `SELECT EXISTS(SELECT 1 FROM wallets WHERE user_id = $1)`, userID)
	if err != nil {
		fmt.Printf("Error checking wallet: %v\n", err)
		return fmt.Errorf("failed to check wallet: %v", err)
	}
	if !walletExists {
		fmt.Printf("User %d has no wallet\n", userID)
		return fmt.Errorf("user has no wallet")
	}

	// Get the room, session, and card info
	var roomID int64
	var sessionID int64
	err = s.DB.GetContext(ctx, &roomID, `
		SELECT room_id FROM available_cards 
		WHERE selected_by_user_id = $1 AND card_number = $2
	`, userID, cardNumber)
	if err != nil {
		return err
	}

	err = s.DB.GetContext(ctx, &sessionID, `
		SELECT id FROM game_sessions 
		WHERE room_id = $1 AND status = 'active' 
		ORDER BY created_at DESC LIMIT 1
	`, roomID)
	if err != nil {
		return err
	}

	// Get the bingo_card_id from bingo_cards
	var bingoCardID int64
	err = s.DB.GetContext(ctx, &bingoCardID, `
		SELECT id FROM bingo_cards 
		WHERE user_id = $1 AND room_id = $2
	`, userID, roomID)
	if err != nil {
		return err
	}

	// Get the card data from available_cards
	var cardData []byte
	err = s.DB.GetContext(ctx, &cardData, `
		SELECT card_data FROM available_cards 
		WHERE selected_by_user_id = $1 AND card_number = $2
	`, userID, cardNumber)
	if err != nil {
		return err
	}

	// Validate that the card has a winning pattern
	var card game.Card
	if err := json.Unmarshal(cardData, &card); err != nil {
		return fmt.Errorf("failed to parse card data: %v", err)
	}

	if !card.HasWinningPattern() {
		return fmt.Errorf("card does not have a winning bingo pattern")
	}

	// Get room bet amount
	var betAmount float64
	err = s.DB.GetContext(ctx, &betAmount, `
		SELECT bet_amount FROM bingo_rooms WHERE id = $1
	`, roomID)
	if err != nil {
		return err
	}

	// Get number of players in the room
	var playerCount int
	err = s.DB.GetContext(ctx, &playerCount, `
		SELECT COUNT(DISTINCT selected_by_user_id) FROM available_cards 
		WHERE room_id = $1 AND is_selected = true
	`, roomID)
	if err != nil {
		return err
	}

	// Calculate winnings (total pot divided by winners)
	totalPot := betAmount * float64(playerCount)
	winningAmount := totalPot // For now, winner takes all

	// Record the winner
	_, err = s.DB.ExecContext(ctx, `
		INSERT INTO winners (session_id, user_id, bingo_card_id, winnings, won_at)
		VALUES ($1, $2, $3, $4, NOW())
	`, sessionID, userID, bingoCardID, winningAmount)
	if err != nil {
		return err
	}

	// Add winnings to user's wallet
	_, err = s.DB.ExecContext(ctx, `
		UPDATE wallets SET balance = balance + $1, updated_at = NOW() 
		WHERE user_id = $2
	`, winningAmount, userID)
	if err != nil {
		return err
	}

	// Record transaction
	_, err = s.DB.ExecContext(ctx, `
		INSERT INTO transactions (user_id, type, amount, created_at)
		VALUES ($1, 'win', $2, NOW())
	`, userID, winningAmount)
	if err != nil {
		return err
	}

	// End the session
	_, err = s.DB.ExecContext(ctx, `
		UPDATE game_sessions SET status = 'completed', session_end_time = NOW() 
		WHERE id = $1
	`, sessionID)
	return err
}

// Get winners for a session
func (s *SessionStore) GetWinners(ctx context.Context, sessionID int64) ([]Winner, error) {
	var winners []Winner
	err := s.DB.SelectContext(ctx, &winners, `SELECT * FROM winners WHERE session_id = $1`, sessionID)
	return winners, err
}

// GetLatestSessionForRoom returns the latest (active or most recent) session for a room
func (s *SessionStore) GetLatestSessionForRoom(ctx context.Context, roomID int64) (*GameSession, error) {
	var session GameSession
	err := s.DB.GetContext(ctx, &session, `
		SELECT * FROM game_sessions
		WHERE room_id = $1
		ORDER BY (status = 'active') DESC, created_at DESC
		LIMIT 1
	`, roomID)
	if err != nil {
		return nil, err
	}
	return &session, nil
}

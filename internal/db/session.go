package db

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
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
	tx, err := s.DB.BeginTxx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Lock the room row to prevent race conditions
	var room BingoRoom
	err = tx.GetContext(ctx, &room, `SELECT * FROM bingo_rooms WHERE id = $1 FOR UPDATE`, roomID)
	if err != nil {
		return nil, err
	}

	// Check if there is already an active session for this room
	var existing GameSession
	err = tx.GetContext(ctx, &existing, `
		SELECT * FROM game_sessions WHERE room_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1
	`, roomID)
	if err == nil && existing.ID != 0 {
		log.Printf("[StartSession] Skipped: Active session already exists for room %d (session %d)", roomID, existing.ID)
		return &existing, nil
	}

	log.Printf("[StartSession] Creating new session for room %d", roomID)
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
	err = tx.GetContext(ctx, &session, `
		INSERT INTO game_sessions (room_id, session_start_time, status, drawn_numbers, remaining_numbers, created_at)
		VALUES ($1, $2, 'active', $3, $4, NOW())
		RETURNING *
	`, roomID, time.Now(), drawn, remaining)
	if err != nil {
		log.Printf("[StartSession] Error creating session for room %d: %v", roomID, err)
		return nil, err
	}

	// Update room status to active
	_, err = tx.ExecContext(ctx, `
		UPDATE bingo_rooms SET status = 'active', updated_at = NOW() WHERE id = $1
	`, roomID)
	if err != nil {
		log.Printf("[StartSession] Error updating room status for room %d: %v", roomID, err)
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	log.Printf("[StartSession] Session %d created for room %d", session.ID, roomID)
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
	tx, err := s.DB.BeginTxx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	// Lock the session row to prevent concurrent draws
	var session GameSession
	err = tx.GetContext(ctx, &session, `SELECT * FROM game_sessions WHERE id = $1 FOR UPDATE`, sessionID)
	if err != nil {
		return 0, err
	}

	var remaining []int
	if err := json.Unmarshal(session.RemainingNumbers, &remaining); err != nil {
		return 0, err
	}
	if len(remaining) == 0 {
		// Mark session as completed due to no numbers left
		_, err := tx.ExecContext(ctx, `
			UPDATE game_sessions
			SET status = 'completed', session_end_time = NOW()
			WHERE id = $1
		`, sessionID)
		if err != nil {
			return 0, fmt.Errorf("failed to end session as draw: %w", err)
		}

		return 0, errors.New("draw: all numbers drawn, session ended with no winner")
	}

	var drawn []int
	if err := json.Unmarshal(session.DrawnNumbers, &drawn); err != nil {
		return 0, err
	}

	// Draw a random number from remaining numbers
	randIndex := rand.Intn(len(remaining))
	drawnNumber := remaining[randIndex]

	// Remove drawn number from remaining
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

	// Update DB inside the transaction
	_, err = tx.ExecContext(ctx, `
		UPDATE game_sessions 
		SET drawn_numbers = $1, remaining_numbers = $2
		WHERE id = $3
	`, newDrawn, newRemaining, sessionID)
	if err != nil {
		return 0, err
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return 0, err
	}

	return drawnNumber, nil
}

// Mark a number on a user's selected card
func (s *SessionStore) MarkNumberOnCard(ctx context.Context, userID int64, cardNumber int, number int) error {
	tx, err := s.DB.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Get the card data with a FOR UPDATE lock to avoid concurrent modifications
	var cardData []byte
	err = tx.GetContext(ctx, &cardData, `
		SELECT bc.card_data FROM bingo_cards bc
		JOIN available_cards ac ON ac.room_id = bc.room_id AND ac.card_number = $2
		WHERE bc.user_id = $1 AND ac.card_number = $2 AND ac.selected_by_user_id = $1
		FOR UPDATE
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

	// Update the card data in bingo_cards table
	_, err = tx.ExecContext(ctx, `
		UPDATE bingo_cards SET card_data = $1 
		WHERE user_id = $2 AND room_id = (SELECT room_id FROM available_cards WHERE card_number = $3 AND selected_by_user_id = $2)
	`, updatedCardData, userID, cardNumber)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// Claim bingo and distribute winnings
func (s *SessionStore) ClaimBingo(ctx context.Context, userID int64, cardNumber int) error {
	tx, err := s.DB.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	// Get the room ID
	var roomID int64
	err = tx.GetContext(ctx, &roomID, `
		SELECT room_id FROM available_cards 
		WHERE selected_by_user_id = $1 AND card_number = $2
	`, userID, cardNumber)
	if err != nil {
		return err
	}

	// Lock and get the active game session
	var session GameSession
	err = tx.GetContext(ctx, &session, `
		SELECT * FROM game_sessions 
		WHERE room_id = $1 AND status = 'active' 
		ORDER BY created_at DESC LIMIT 1 FOR UPDATE
	`, roomID)
	if err != nil {
		return err
	}
	sessionID := session.ID

	// Get the card data
	var cardData []byte
	err = tx.GetContext(ctx, &cardData, `
		SELECT card_data FROM available_cards 
		WHERE selected_by_user_id = $1 AND card_number = $2
	`, userID, cardNumber)
	if err != nil {
		return err
	}

	var card game.Card
	if err := json.Unmarshal(cardData, &card); err != nil {
		return fmt.Errorf("failed to parse card data: %v", err)
	}

	var drawnNumbers []int
	if err := json.Unmarshal(session.DrawnNumbers, &drawnNumbers); err != nil {
		return fmt.Errorf("failed to parse drawn numbers: %v", err)
	}

	// Handle invalid bingo claim by kicking the user from the room
	if !card.ValidateBingo(drawnNumbers) {
		// Unassign the user's selected card(s) in the room
		_, err = tx.ExecContext(ctx, `
			UPDATE available_cards 
			SET selected_by_user_id = NULL, is_selected = FALSE 
			WHERE room_id = $1 AND selected_by_user_id = $2
		`, roomID, userID)
		if err != nil {
			return fmt.Errorf("invalid bingo: failed to kick user from room: %v", err)
		}

		// Optionally: log or record this invalid claim for audit or penalties
		_, _ = tx.ExecContext(ctx, `
			INSERT INTO invalid_claims (user_id, room_id, claimed_at)
			VALUES ($1, $2, NOW())
		`, userID, roomID)

		return fmt.Errorf("invalid bingo claim: user has been removed from the room")
	}

	// Get room bet amount
	var betAmount float64
	err = tx.GetContext(ctx, &betAmount, `
		SELECT bet_amount FROM bingo_rooms WHERE id = $1
	`, roomID)
	if err != nil {
		return err
	}

	// Count players
	var playerCount int
	err = tx.GetContext(ctx, &playerCount, `
		SELECT COUNT(DISTINCT selected_by_user_id) FROM available_cards 
		WHERE room_id = $1 AND is_selected = TRUE
	`, roomID)
	if err != nil {
		return err
	}

	totalPot := betAmount * float64(playerCount)
	winningAmount := totalPot // Winner takes all

	// Get bingo_card_id
	var bingoCardID int64
	err = tx.GetContext(ctx, &bingoCardID, `
		SELECT id FROM bingo_cards 
		WHERE user_id = $1 AND room_id = $2
	`, userID, roomID)
	if err != nil {
		return err
	}

	// Save winner info
	_, err = tx.ExecContext(ctx, `
		INSERT INTO winners (session_id, user_id, bingo_card_id, winnings, won_at)
		VALUES ($1, $2, $3, $4, NOW())
	`, sessionID, userID, bingoCardID, winningAmount)
	if err != nil {
		return err
	}

	// Update wallet
	_, err = tx.ExecContext(ctx, `
		UPDATE wallets 
		SET balance = balance + $1, updated_at = NOW() 
		WHERE user_id = $2
	`, winningAmount, userID)
	if err != nil {
		return err
	}

	// Add transaction log
	_, err = tx.ExecContext(ctx, `
		INSERT INTO transactions (user_id, type, amount, created_at)
		VALUES ($1, 'win', $2, NOW())
	`, userID, winningAmount)
	if err != nil {
		return err
	}

	// End session
	_, err = tx.ExecContext(ctx, `
		UPDATE game_sessions 
		SET status = 'completed', session_end_time = NOW() 
		WHERE id = $1
	`, sessionID)
	if err != nil {
		return err
	}

	return tx.Commit()
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

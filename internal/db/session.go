package db

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
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

	// Draw number and update slices
	drawnNumber := remaining[0]
	remaining = remaining[1:]
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

// Mark a number on a card
func (s *SessionStore) MarkNumber(ctx context.Context, cardID int64, number int) error {
	var cardData []byte
	err := s.DB.GetContext(ctx, &cardData, `SELECT card_data FROM bingo_cards WHERE id = $1`, cardID)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("card not found")
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
		UPDATE bingo_cards SET card_data = $1 WHERE id = $2
	`, updatedCardData, cardID)
	return err
}

// Claim bingo (set is_winner true)
func (s *SessionStore) ClaimBingo(ctx context.Context, cardID int64) error {
	_, err := s.DB.ExecContext(ctx, `UPDATE bingo_cards SET is_winner = TRUE WHERE id = $1`, cardID)
	return err
}

// Get winners for a session
func (s *SessionStore) GetWinners(ctx context.Context, sessionID int64) ([]Winner, error) {
	var winners []Winner
	err := s.DB.SelectContext(ctx, &winners, `SELECT * FROM winners WHERE session_id = $1`, sessionID)
	return winners, err
}

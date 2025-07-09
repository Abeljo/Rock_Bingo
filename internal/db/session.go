package db

import (
	"context"
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
	var session GameSession
	err := s.DB.GetContext(ctx, &session, `
		INSERT INTO game_sessions (room_id, session_start_time, status, created_at)
		VALUES ($1, $2, 'active', NOW())
		RETURNING *
	`, roomID, time.Now())
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
func (s *SessionStore) DrawNumber(ctx context.Context, sessionID int64, number int) (*GameNumber, error) {
	var gn GameNumber
	err := s.DB.GetContext(ctx, &gn, `
		INSERT INTO game_numbers (session_id, drawn_number, drawn_at)
		VALUES ($1, $2, NOW())
		RETURNING *
	`, sessionID, number)
	if err != nil {
		return nil, err
	}
	return &gn, nil
}

// Mark a number on a card (update card_data JSONB)
func (s *SessionStore) MarkNumber(ctx context.Context, cardID int64, number int) error {
	// This assumes card_data is an array of objects with a 'number' and 'marked' field
	_, err := s.DB.ExecContext(ctx, `
		UPDATE bingo_cards SET card_data = jsonb_set(card_data, '{marks}', card_data->'marks' || to_jsonb($1::int)) WHERE id = $2
	`, number, cardID)
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

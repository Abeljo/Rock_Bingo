package db

import (
	"context"
	"database/sql"

	"github.com/jmoiron/sqlx"
)

type UserStore struct {
	DB *sqlx.DB
}

func NewUserStore(db *sqlx.DB) *UserStore {
	return &UserStore{DB: db}
}

// Find or create user by Telegram ID
func (s *UserStore) FindOrCreateByTelegram(ctx context.Context, telegramID int64, username, firstName, lastName string) (*User, error) {
	var user User
	err := s.DB.GetContext(ctx, &user, `SELECT * FROM users WHERE telegram_id = $1`, telegramID)
	if err == sql.ErrNoRows {
		// Create new user
		err = s.DB.GetContext(ctx, &user, `
			INSERT INTO users (telegram_id, username, first_name, last_name)
			VALUES ($1, $2, $3, $4)
			RETURNING *
		`, telegramID, username, firstName, lastName)
		if err != nil {
			return nil, err
		}
		// Create wallet for new user
		_, werr := s.DB.ExecContext(ctx, `
			INSERT INTO wallets (user_id, balance, created_at, updated_at)
			VALUES ($1, 0, NOW(), NOW())
		`, user.ID)
		if werr != nil {
			return nil, werr
		}
	}
	return &user, err
}

// Get user by ID
func (s *UserStore) GetByID(ctx context.Context, id int64) (*User, error) {
	var user User
	err := s.DB.GetContext(ctx, &user, `SELECT * FROM users WHERE id = $1`, id)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// Update user profile
func (s *UserStore) UpdateProfile(ctx context.Context, id int64, username, firstName, lastName string) error {
	_, err := s.DB.ExecContext(ctx, `
		UPDATE users SET username = $1, first_name = $2, last_name = $3 WHERE id = $4
	`, username, firstName, lastName, id)
	return err
}

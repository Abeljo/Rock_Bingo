package db

import (
	"context"

	"github.com/jmoiron/sqlx"
)

type AuditStore struct {
	DB *sqlx.DB
}

func NewAuditStore(db *sqlx.DB) *AuditStore {
	return &AuditStore{DB: db}
}

// Get audit logs by user ID
func (s *AuditStore) GetAuditLogs(ctx context.Context, userID int64) ([]AuditLog, error) {
	var logs []AuditLog
	err := s.DB.SelectContext(ctx, &logs, `SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC`, userID)
	return logs, err
}

// Create an audit log entry
func (s *AuditStore) CreateAuditLog(ctx context.Context, userID int64, action string, details []byte) error {
	_, err := s.DB.ExecContext(ctx, `
		INSERT INTO audit_logs (user_id, action, details)
		VALUES ($1, $2, $3)
	`, userID, action, details)
	return err
} 
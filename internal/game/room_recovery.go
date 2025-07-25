package game

import (
	"context"
	"database/sql"
	"log"
	"time"
)

// StartStuckRoomRecovery launches a background process to recover stuck rooms automatically.
func StartStuckRoomRecovery(db *sql.DB) {
	go func() {
		for {
			err := recoverStuckRooms(context.Background(), db)
			if err != nil {
				log.Printf("Stuck room recovery error: %v", err)
			}
			time.Sleep(10 * time.Second) // adjust interval as needed
		}
	}()
}

func recoverStuckRooms(ctx context.Context, db *sql.DB) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Find rooms in waiting state where countdown passed but no session exists
	rows, err := tx.QueryContext(ctx, `
        SELECT r.id
        FROM rooms r
        WHERE r.status = 'waiting'
          AND r.countdown_end_time < NOW()
          AND NOT EXISTS (
              SELECT 1 FROM game_sessions s WHERE s.room_id = r.id
          )
        FOR UPDATE SKIP LOCKED
    `)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var roomID int64
		if err := rows.Scan(&roomID); err != nil {
			return err
		}

		log.Printf("Recovering stuck room: %d", roomID)

		// Mark room as in-game
		_, err := tx.ExecContext(ctx, `
            UPDATE rooms
            SET status = 'in_game'
            WHERE id = $1
        `, roomID)
		if err != nil {
			return err
		}

		// Start new session
		_, err = tx.ExecContext(ctx, `
            INSERT INTO game_sessions (room_id, session_start_time, status)
            VALUES ($1, NOW(), 'active')
        `, roomID)
		if err != nil {
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	return nil
}

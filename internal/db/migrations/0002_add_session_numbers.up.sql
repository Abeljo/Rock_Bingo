ALTER TABLE game_sessions ADD COLUMN drawn_numbers JSONB NOT NULL DEFAULT '[]';
ALTER TABLE game_sessions ADD COLUMN remaining_numbers JSONB NOT NULL DEFAULT '[]';
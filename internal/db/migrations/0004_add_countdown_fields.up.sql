-- Add countdown fields to bingo_rooms table
ALTER TABLE bingo_rooms 
ADD COLUMN countdown_start TIMESTAMPTZ,
ADD COLUMN game_start_time TIMESTAMPTZ;

-- Add index for faster countdown queries
CREATE INDEX IF NOT EXISTS idx_bingo_rooms_countdown ON bingo_rooms(countdown_start); 
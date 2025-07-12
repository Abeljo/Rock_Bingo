-- Drop index
DROP INDEX IF EXISTS idx_bingo_rooms_countdown;

-- Remove countdown fields from bingo_rooms table
ALTER TABLE bingo_rooms 
DROP COLUMN IF EXISTS countdown_start,
DROP COLUMN IF EXISTS game_start_time; 
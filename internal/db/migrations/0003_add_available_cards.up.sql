-- Available Cards table
CREATE TABLE IF NOT EXISTS available_cards (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES bingo_rooms(id),
    card_number INTEGER, -- 1-100
    card_data JSONB,
    is_selected BOOLEAN DEFAULT FALSE,
    selected_by_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, card_number)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_available_cards_room_id ON available_cards(room_id);
CREATE INDEX IF NOT EXISTS idx_available_cards_selected ON available_cards(room_id, is_selected); 
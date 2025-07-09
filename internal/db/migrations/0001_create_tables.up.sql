-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE,
    username VARCHAR(64),
    first_name VARCHAR(64),
    last_name VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Bingo Rooms table
CREATE TABLE IF NOT EXISTS bingo_rooms (
    id SERIAL PRIMARY KEY,
    bet_amount NUMERIC,
    current_players INTEGER,
    max_players INTEGER,
    status VARCHAR(32),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Bingo Cards table
CREATE TABLE IF NOT EXISTS bingo_cards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    room_id INTEGER REFERENCES bingo_rooms(id),
    card_data JSONB,
    is_winner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Game Sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES bingo_rooms(id),
    session_start_time TIMESTAMPTZ,
    session_end_time TIMESTAMPTZ,
    status VARCHAR(32),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Game Numbers table
CREATE TABLE IF NOT EXISTS game_numbers (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES game_sessions(id),
    drawn_number INTEGER,
    drawn_at TIMESTAMPTZ
);

-- Winners table
CREATE TABLE IF NOT EXISTS winners (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES game_sessions(id),
    user_id INTEGER REFERENCES users(id),
    bingo_card_id INTEGER REFERENCES bingo_cards(id),
    winnings NUMERIC,
    won_at TIMESTAMPTZ
);

-- User Bets table
CREATE TABLE IF NOT EXISTS user_bets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    room_id INTEGER REFERENCES bingo_rooms(id),
    bingo_card_id INTEGER REFERENCES bingo_cards(id),
    bet_amount NUMERIC,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    balance NUMERIC,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(32),
    amount NUMERIC,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Payment Deposits table
CREATE TABLE IF NOT EXISTS payment_deposits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount NUMERIC,
    currency VARCHAR(16),
    transaction_ref VARCHAR(128),
    status VARCHAR(32),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(128),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Schema Migrations table (for go-migrate)
CREATE TABLE IF NOT EXISTS schema_migrations (
    version BIGINT NOT NULL PRIMARY KEY,
    dirty BOOLEAN NOT NULL
); 
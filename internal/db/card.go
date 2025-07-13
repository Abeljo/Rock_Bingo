package db

import (
	"context"
	"rockbingo/internal/game"

	"github.com/jmoiron/sqlx"
)

type CardStore struct {
	DB *sqlx.DB
}

func NewCardStore(db *sqlx.DB) *CardStore {
	return &CardStore{DB: db}
}

// Create a new card for a user in a room
func (s *CardStore) CreateCard(ctx context.Context, userID, roomID int64) (*BingoCard, error) {
	card := game.NewCard()
	cardData, err := card.ToJSON()
	if err != nil {
		return nil, err
	}

	var newCard BingoCard
	err = s.DB.GetContext(ctx, &newCard, `
		INSERT INTO bingo_cards (user_id, room_id, card_data, is_winner)
		VALUES ($1, $2, $3, false)
		RETURNING *
	`, userID, roomID, cardData)
	if err != nil {
		return nil, err
	}
	return &newCard, nil
}

// Get card by ID
func (s *CardStore) GetCard(ctx context.Context, cardID int64) (*BingoCard, error) {
	var card BingoCard
	err := s.DB.GetContext(ctx, &card, `SELECT * FROM bingo_cards WHERE id = $1`, cardID)
	if err != nil {
		return nil, err
	}
	return &card, nil
}

// Get all cards for a user in a room
func (s *CardStore) GetUserCardsInRoom(ctx context.Context, userID, roomID int64) ([]BingoCard, error) {
	var cards []BingoCard
	err := s.DB.SelectContext(ctx, &cards, `SELECT * FROM bingo_cards WHERE user_id = $1 AND room_id = $2`, userID, roomID)
	return cards, err
}

// Get all cards in a room
func (s *CardStore) GetAllCardsInRoom(ctx context.Context, roomID int64) ([]BingoCard, error) {
	var cards []BingoCard
	err := s.DB.SelectContext(ctx, &cards, `SELECT * FROM bingo_cards WHERE room_id = $1`, roomID)
	return cards, err
}

// Initialize available cards for a room
func (s *CardStore) InitializeAvailableCards(ctx context.Context, roomID int64) error {
	// Generate 100 available cards
	cards := game.GenerateAvailableCards()

	// Insert all cards into the database
	for i, card := range cards {
		cardData, err := card.ToJSON()
		if err != nil {
			return err
		}

		_, err = s.DB.ExecContext(ctx, `
			INSERT INTO available_cards (room_id, card_number, card_data)
			VALUES ($1, $2, $3)
		`, roomID, i+1, cardData)
		if err != nil {
			return err
		}
	}
	return nil
}

// Get available cards for a room
func (s *CardStore) GetAvailableCards(ctx context.Context, roomID int64) ([]AvailableCard, error) {
	// First check if the table exists
	var tableExists bool
	err := s.DB.GetContext(ctx, &tableExists, `
		SELECT EXISTS (
			SELECT FROM information_schema.tables 
			WHERE table_schema = 'public' 
			AND table_name = 'available_cards'
		)
	`)
	if err != nil {
		return nil, err
	}

	if !tableExists {
		// Table doesn't exist, initialize it
		err = s.InitializeAvailableCards(ctx, roomID)
		if err != nil {
			return nil, err
		}
	}

	var cards []AvailableCard
	err = s.DB.SelectContext(ctx, &cards, `
		SELECT * FROM available_cards 
		WHERE room_id = $1 
		ORDER BY card_number
	`, roomID)
	if err != nil {
		return nil, err
	}

	// If no cards found, initialize them
	if len(cards) == 0 {
		err = s.InitializeAvailableCards(ctx, roomID)
		if err != nil {
			return nil, err
		}
		// Fetch the cards again
		err = s.DB.SelectContext(ctx, &cards, `
			SELECT * FROM available_cards 
			WHERE room_id = $1 
			ORDER BY card_number
		`, roomID)
	}

	return cards, err
}

// Select a card for a user
func (s *CardStore) SelectCard(ctx context.Context, roomID int64, cardNumber int, userID int64) error {
	// Select the card in available_cards
	res, err := s.DB.ExecContext(ctx, `
		UPDATE available_cards 
		SET is_selected = true, selected_by_user_id = $1
		WHERE room_id = $2 AND card_number = $3 AND is_selected = false
	`, userID, roomID, cardNumber)
	if err != nil {
		return err
	}

	// Only proceed if a row was updated (i.e., card was actually selected)
	affected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		// Card was already selected or does not exist
		return nil
	}

	// Check if bingo_cards already has a card for this user/room
	var count int
	err = s.DB.GetContext(ctx, &count, `
		SELECT COUNT(*) FROM bingo_cards WHERE user_id = $1 AND room_id = $2
	`, userID, roomID)
	if err != nil {
		return err
	}
	if count == 0 {
		// Get the card data from available_cards
		var cardData []byte
		err = s.DB.GetContext(ctx, &cardData, `
			SELECT card_data FROM available_cards WHERE room_id = $1 AND card_number = $2
		`, roomID, cardNumber)
		if err != nil {
			return err
		}
		// Insert into bingo_cards
		_, err = s.DB.ExecContext(ctx, `
			INSERT INTO bingo_cards (user_id, room_id, card_data, is_winner)
			VALUES ($1, $2, $3, false)
		`, userID, roomID, cardData)
		if err != nil {
			return err
		}
	}
	return nil
}

// Get user's selected card
func (s *CardStore) GetUserSelectedCard(ctx context.Context, roomID, userID int64) (*AvailableCard, error) {
	var card AvailableCard
	err := s.DB.GetContext(ctx, &card, `
		SELECT * FROM available_cards 
		WHERE room_id = $1 AND selected_by_user_id = $2
	`, roomID, userID)
	if err != nil {
		return nil, err
	}
	return &card, nil
}

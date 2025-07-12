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

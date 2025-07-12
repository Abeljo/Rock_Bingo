package api

import (
	"context"
	"net/http"
	"rockbingo/internal/db"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

var cardStore *db.CardStore

func InitCardHandlers(store *db.CardStore) {
	cardStore = store
}

func CreateCardHandler(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return err
	}
	type req struct {
		RoomID int64 `json:"room_id"`
	}
	var body req
	if err := c.BodyParser(&body); err != nil {
		return fiber.NewError(http.StatusBadRequest, "Invalid request body")
	}
	card, err := cardStore.CreateCard(context.Background(), userID, body.RoomID)
	if err != nil {
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(card)
}

func GetCardHandler(c *fiber.Ctx) error {
	cardID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return fiber.NewError(http.StatusBadRequest, "Invalid card ID")
	}
	card, err := cardStore.GetCard(context.Background(), cardID)
	if err != nil {
		return fiber.NewError(http.StatusNotFound, "Card not found")
	}
	return c.JSON(card)
}

func GetAvailableCardsHandler(c *fiber.Ctx) error {
	roomID, err := strconv.ParseInt(c.Params("roomId"), 10, 64)
	if err != nil {
		return fiber.NewError(http.StatusBadRequest, "Invalid room ID")
	}
	cards, err := cardStore.GetAvailableCards(context.Background(), roomID)
	if err != nil {
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(cards)
}

func SelectCardHandler(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return err
	}

	roomID, err := strconv.ParseInt(c.Params("roomId"), 10, 64)
	if err != nil {
		return fiber.NewError(http.StatusBadRequest, "Invalid room ID")
	}

	type req struct {
		CardNumber int `json:"card_number"`
	}
	var body req
	if err := c.BodyParser(&body); err != nil {
		return fiber.NewError(http.StatusBadRequest, "Invalid request body")
	}

	err = cardStore.SelectCard(context.Background(), roomID, body.CardNumber, userID)
	if err != nil {
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}

	return c.SendStatus(http.StatusNoContent)
}

func GetUserSelectedCardHandler(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return err
	}

	roomID, err := strconv.ParseInt(c.Params("roomId"), 10, 64)
	if err != nil {
		return fiber.NewError(http.StatusBadRequest, "Invalid room ID")
	}

	card, err := cardStore.GetUserSelectedCard(context.Background(), roomID, userID)
	if err != nil {
		return fiber.NewError(http.StatusNotFound, "No card selected")
	}

	return c.JSON(card)
}

func RegisterCardRoutes(router fiber.Router) {
	router.Post("/cards", CreateCardHandler)
	router.Get("/cards/:id", GetCardHandler)
	router.Get("/rooms/:roomId/available-cards", GetAvailableCardsHandler)
	router.Post("/rooms/:roomId/select-card", SelectCardHandler)
	router.Get("/rooms/:roomId/my-card", GetUserSelectedCardHandler)
}

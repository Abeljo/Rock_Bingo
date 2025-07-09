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

func RegisterCardRoutes(router fiber.Router) {
	router.Get("/cards/:id", GetCardHandler)
}

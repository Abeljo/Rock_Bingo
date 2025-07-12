package api

import (
	"context"
	"net/http"
	"rockbingo/internal/db"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

var sessionStore *db.SessionStore

func InitSessionHandlers(store *db.SessionStore) {
	sessionStore = store
}

func CreateSessionHandler(c *fiber.Ctx) error {
	type req struct {
		RoomID int64 `json:"room_id"`
	}
	var body req
	if err := c.BodyParser(&body); err != nil {
		return fiber.NewError(http.StatusBadRequest, "Invalid request body")
	}
	session, err := sessionStore.StartSession(context.Background(), body.RoomID)
	if err != nil {
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(session)
}

func GetSessionHandler(c *fiber.Ctx) error {
	sessionID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return fiber.NewError(http.StatusBadRequest, "Invalid session ID")
	}
	session, err := sessionStore.GetSession(context.Background(), sessionID)
	if err != nil {
		return fiber.NewError(http.StatusNotFound, "Session not found")
	}
	return c.JSON(session)
}

func DrawNumberHandler(c *fiber.Ctx) error {
	sessionID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return fiber.NewError(http.StatusBadRequest, "Invalid session ID")
	}
	number, err := sessionStore.DrawNumber(context.Background(), sessionID)
	if err != nil {
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(fiber.Map{"number": number})
}

func MarkNumberHandler(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return err
	}

	type req struct {
		CardNumber int `json:"card_number"`
		Number     int `json:"number"`
	}
	var body req
	if err := c.BodyParser(&body); err != nil {
		return fiber.NewError(http.StatusBadRequest, "Invalid request body")
	}
	if err := sessionStore.MarkNumberOnCard(context.Background(), userID, body.CardNumber, body.Number); err != nil {
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	return c.SendStatus(http.StatusNoContent)
}

func ClaimBingoHandler(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return err
	}

	type req struct {
		CardNumber int `json:"card_number"`
	}
	var body req
	if err := c.BodyParser(&body); err != nil {
		return fiber.NewError(http.StatusBadRequest, "Invalid request body")
	}
	if err := sessionStore.ClaimBingo(context.Background(), userID, body.CardNumber); err != nil {
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	return c.SendStatus(http.StatusNoContent)
}

func GetWinnersHandler(c *fiber.Ctx) error {
	sessionID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return fiber.NewError(http.StatusBadRequest, "Invalid session ID")
	}
	winners, err := sessionStore.GetWinners(context.Background(), sessionID)
	if err != nil {
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(winners)
}

func RegisterSessionRoutes(router fiber.Router) {
	router.Post("/sessions", CreateSessionHandler)
	router.Get("/sessions/:id", GetSessionHandler)
	router.Post("/sessions/:id/draw", DrawNumberHandler)
	router.Post("/sessions/:id/mark", MarkNumberHandler)
	router.Post("/sessions/:id/bingo", ClaimBingoHandler)
	router.Get("/sessions/:id/winners", GetWinnersHandler)
}

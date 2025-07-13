package api

import (
	"context"
	"net/http"
	"rockbingo/internal/db"
	"strconv"

	"log"

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
		log.Printf("[CreateSessionHandler] BodyParser error: %v", err)
		return fiber.NewError(http.StatusBadRequest, "Invalid request body")
	}
	log.Printf("[CreateSessionHandler] Starting session for roomID=%d", body.RoomID)
	session, err := sessionStore.StartSession(context.Background(), body.RoomID)
	if err != nil {
		log.Printf("[CreateSessionHandler] StartSession error: %v", err)
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
		log.Printf("[DrawNumberHandler] Invalid session ID: %v", err)
		return fiber.NewError(http.StatusBadRequest, "Invalid session ID")
	}
	log.Printf("[DrawNumberHandler] Drawing number for sessionID=%d", sessionID)
	number, err := sessionStore.DrawNumber(context.Background(), sessionID)
	if err != nil {
		log.Printf("[DrawNumberHandler] DrawNumber error: %v", err)
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(fiber.Map{"number": number})
}

func MarkNumberHandler(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		log.Printf("[MarkNumberHandler] getUserID error: %v", err)
		return err
	}

	type req struct {
		CardNumber int `json:"card_number"`
		Number     int `json:"number"`
	}
	var body req
	if err := c.BodyParser(&body); err != nil {
		log.Printf("[MarkNumberHandler] BodyParser error: %v", err)
		return fiber.NewError(http.StatusBadRequest, "Invalid request body")
	}
	log.Printf("[MarkNumberHandler] userID=%d, cardNumber=%d, number=%d", userID, body.CardNumber, body.Number)
	if err := sessionStore.MarkNumberOnCard(context.Background(), userID, body.CardNumber, body.Number); err != nil {
		log.Printf("[MarkNumberHandler] MarkNumberOnCard error: %v", err)
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	return c.SendStatus(http.StatusNoContent)
}

func ClaimBingoHandler(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		log.Printf("[ClaimBingoHandler] getUserID error: %v", err)
		return err
	}

	type req struct {
		CardNumber int `json:"card_number"`
	}
	var body req
	if err := c.BodyParser(&body); err != nil {
		log.Printf("[ClaimBingoHandler] BodyParser error: %v", err)
		return fiber.NewError(http.StatusBadRequest, "Invalid request body")
	}
	log.Printf("[ClaimBingoHandler] userID=%d, cardNumber=%d", userID, body.CardNumber)
	if err := sessionStore.ClaimBingo(context.Background(), userID, body.CardNumber); err != nil {
		log.Printf("[ClaimBingoHandler] ClaimBingo error: %v", err)
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

func GetCurrentSessionForRoomHandler(c *fiber.Ctx) error {
	roomID, err := strconv.ParseInt(c.Params("roomId"), 10, 64)
	if err != nil {
		return fiber.NewError(http.StatusBadRequest, "Invalid room ID")
	}
	// Try to get the latest active session, or the most recent session if none are active
	session, err := sessionStore.GetLatestSessionForRoom(context.Background(), roomID)
	if err != nil {
		return fiber.NewError(http.StatusNotFound, "No session found for this room")
	}
	return c.JSON(session)
}

func AutoDrawNumberHandler(c *fiber.Ctx) error {
	sessionID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return fiber.NewError(http.StatusBadRequest, "Invalid session ID")
	}

	// Draw a number automatically
	number, err := sessionStore.DrawNumber(context.Background(), sessionID)
	if err != nil {
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(fiber.Map{
		"number":  number,
		"message": "Number drawn automatically",
	})
}

func RegisterSessionRoutes(router fiber.Router) {
	router.Post("/sessions", CreateSessionHandler)
	router.Get("/sessions/:id", GetSessionHandler)
	router.Get("/rooms/:roomId/session", GetCurrentSessionForRoomHandler)
	router.Post("/sessions/:id/draw", DrawNumberHandler)
	router.Post("/sessions/:id/auto-draw", AutoDrawNumberHandler)
	router.Post("/sessions/:id/mark", MarkNumberHandler)
	router.Post("/sessions/:id/bingo", ClaimBingoHandler)
	router.Get("/sessions/:id/winners", GetWinnersHandler)
}

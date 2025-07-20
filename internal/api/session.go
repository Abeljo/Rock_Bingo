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
	userID, err := getUserID(c)
	if err != nil {
		return err
	}
	type req struct {
		RoomID int64 `json:"room_id"`
	}
	var body req
	if err := c.BodyParser(&body); err != nil {
		log.Printf("[CreateSessionHandler] BodyParser error: %v", err)
		return fiber.NewError(http.StatusBadRequest, "Invalid request body")
	}
	log.Printf("[CreateSessionHandler] userID=%d starting session for roomID=%d", userID, body.RoomID)
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
	userID, err := getUserID(c)
	if err != nil {
		return err
	}
	sessionID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		log.Printf("[DrawNumberHandler] Invalid session ID: %v", err)
		return fiber.NewError(http.StatusBadRequest, "Invalid session ID")
	}
	log.Printf("[DrawNumberHandler] userID=%d drawing number for sessionID=%d", userID, sessionID)
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

func ForceStartSessionHandler(c *fiber.Ctx) error {
	roomID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return fiber.NewError(http.StatusBadRequest, "Invalid room ID")
	}
	_, err = sessionStore.StartSession(context.Background(), roomID)
	if err != nil {
		log.Printf("[Admin] Error force starting session for room %d: %v", roomID, err)
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	log.Printf("[Admin] Session force started for room %d via API", roomID)
	return c.SendStatus(http.StatusNoContent)
}

func GetStuckRoomsHandler(c *fiber.Ctx) error {
	// Rooms where countdown ended but no active session exists
	rows, err := sessionStore.DB.Queryx(`
		SELECT r.id, r.bet_amount, r.status, r.countdown_start, r.game_start_time
		FROM bingo_rooms r
		WHERE r.countdown_start IS NOT NULL
		AND r.game_start_time IS NOT NULL
		AND r.game_start_time < NOW()
		AND r.status = 'waiting'
		AND NOT EXISTS (
			SELECT 1 FROM game_sessions s WHERE s.room_id = r.id AND s.status = 'active'
		)
	`)
	if err != nil {
		log.Printf("[Admin] Error fetching stuck rooms: %v", err)
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	var stuckRooms []map[string]interface{}
	for rows.Next() {
		m := make(map[string]interface{})
		if err := rows.MapScan(m); err == nil {
			stuckRooms = append(stuckRooms, m)
		}
	}
	return c.JSON(stuckRooms)
}

func RecoverStuckRoomsHandler(c *fiber.Ctx) error {
	rows, err := sessionStore.DB.Queryx(`
		SELECT r.id
		FROM bingo_rooms r
		WHERE r.countdown_start IS NOT NULL
		AND r.game_start_time IS NOT NULL
		AND r.game_start_time < NOW()
		AND r.status = 'waiting'
		AND NOT EXISTS (
			SELECT 1 FROM game_sessions s WHERE s.room_id = r.id AND s.status = 'active'
		)
	`)
	if err != nil {
		log.Printf("[Admin] Error fetching stuck rooms for recovery: %v", err)
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	var recovered []int64
	for rows.Next() {
		var roomID int64
		if err := rows.Scan(&roomID); err == nil {
			_, err := sessionStore.StartSession(context.Background(), roomID)
			if err == nil {
				log.Printf("[Admin] Recovered stuck room %d by starting session", roomID)
				recovered = append(recovered, roomID)
			}
		}
	}
	return c.JSON(fiber.Map{"recovered": recovered})
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
	router.Post("/rooms/:id/force-session", ForceStartSessionHandler)   // Admin tool
	router.Get("/admin/stuck-rooms", GetStuckRoomsHandler)              // Admin tool
	router.Post("/admin/recover-stuck-rooms", RecoverStuckRoomsHandler) // Admin tool
}

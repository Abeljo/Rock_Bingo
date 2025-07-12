package api

import (
	"context"
	"net/http"
	"rockbingo/internal/db"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

var roomStore *db.RoomStore

func InitRoomHandlers(store *db.RoomStore) {
	roomStore = store
}

func CreateRoomHandler(c *fiber.Ctx) error {
	// userID, err := getUserID(c)
	// if err != nil {
	// 	return err
	// }
	type req struct {
		BetAmount  float64 `json:"bet_amount"`
		MaxPlayers int     `json:"max_players"`
	}
	var body req
	if err := c.BodyParser(&body); err != nil {
		return fiber.NewError(http.StatusBadRequest, "Invalid request body")
	}
	room, err := roomStore.CreateRoom(context.Background(), body.BetAmount, body.MaxPlayers)
	if err != nil {
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(room)
}

func ListRoomsHandler(c *fiber.Ctx) error {
	rooms, err := roomStore.ListRooms(context.Background())
	if err != nil {
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(rooms)
}

func GetRoomHandler(c *fiber.Ctx) error {
	roomID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return fiber.NewError(http.StatusBadRequest, "Invalid room ID")
	}
	room, err := roomStore.GetRoom(context.Background(), roomID)
	if err != nil {
		return fiber.NewError(http.StatusNotFound, "Room not found")
	}
	return c.JSON(room)
}

func JoinRoomHandler(c *fiber.Ctx) error {
	roomID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return fiber.NewError(http.StatusBadRequest, "Invalid room ID")
	}
	if err := roomStore.JoinRoom(context.Background(), roomID); err != nil {
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	return c.SendStatus(http.StatusNoContent)
}

func LeaveRoomHandler(c *fiber.Ctx) error {
	roomID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return fiber.NewError(http.StatusBadRequest, "Invalid room ID")
	}
	if err := roomStore.LeaveRoom(context.Background(), roomID); err != nil {
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	return c.SendStatus(http.StatusNoContent)
}

func StartRoomHandler(c *fiber.Ctx) error {
	roomID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return fiber.NewError(http.StatusBadRequest, "Invalid room ID")
	}
	if err := roomStore.StartRoom(context.Background(), roomID); err != nil {
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	return c.SendStatus(http.StatusNoContent)
}

func GetRoomPlayersHandler(c *fiber.Ctx) error {
	roomID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return fiber.NewError(http.StatusBadRequest, "Invalid room ID")
	}
	players, err := roomStore.GetRoomPlayers(context.Background(), roomID)
	if err != nil {
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(players)
}

func GetRoomCardsHandler(c *fiber.Ctx) error {
	roomID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return fiber.NewError(http.StatusBadRequest, "Invalid room ID")
	}
	cards, err := roomStore.GetRoomCards(context.Background(), roomID)
	if err != nil {
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(cards)
}

func PlaceBetHandler(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return err
	}
	roomID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return fiber.NewError(http.StatusBadRequest, "Invalid room ID")
	}
	type req struct {
		BingoCardID int64   `json:"bingo_card_id"`
		BetAmount   float64 `json:"bet_amount"`
	}
	var body req
	if err := c.BodyParser(&body); err != nil {
		return fiber.NewError(http.StatusBadRequest, "Invalid request body")
	}
	if err := roomStore.PlaceBet(context.Background(), userID, roomID, body.BingoCardID, body.BetAmount); err != nil {
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	return c.SendStatus(http.StatusNoContent)
}

func FindOrCreateRoomHandler(c *fiber.Ctx) error {
	_, err := getUserID(c)
	if err != nil {
		return err
	}

	type req struct {
		BetAmount float64 `json:"bet_amount"`
	}
	var body req
	if err := c.BodyParser(&body); err != nil {
		return fiber.NewError(http.StatusBadRequest, "Invalid request body")
	}

	// Find existing room with same bet amount and available space
	room, err := roomStore.FindOrCreateRoom(context.Background(), body.BetAmount)
	if err != nil {
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}

	// Auto-join the room
	if err := roomStore.JoinRoom(context.Background(), room.ID); err != nil {
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(room)
}

func RegisterRoomRoutes(router fiber.Router) {
	router.Post("/rooms", CreateRoomHandler)
	router.Post("/rooms/find-or-create", FindOrCreateRoomHandler)
	router.Get("/rooms", ListRoomsHandler)
	router.Get("/rooms/:id", GetRoomHandler)
	router.Post("/rooms/:id/join", JoinRoomHandler)
	router.Post("/rooms/:id/leave", LeaveRoomHandler)
	router.Post("/rooms/:id/start", StartRoomHandler)
	router.Get("/rooms/:id/players", GetRoomPlayersHandler)
	router.Get("/rooms/:id/cards", GetRoomCardsHandler)
	router.Post("/rooms/:id/bet", PlaceBetHandler)
}

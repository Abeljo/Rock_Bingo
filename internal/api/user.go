package api

import (
	"context"
	"net/http"
	"rockbingo/internal/db"

	"log"

	"github.com/gofiber/fiber/v2"
)

var userStore *db.UserStore

func InitUserHandlers(store *db.UserStore) {
	userStore = store
}

func TelegramAuthHandler(c *fiber.Ctx) error {
	type req struct {
		TelegramID int64  `json:"telegram_id"`
		Username   string `json:"username"`
		FirstName  string `json:"first_name"`
		LastName   string `json:"last_name"`
	}
	var body req
	if err := c.BodyParser(&body); err != nil {
		log.Printf("[TelegramAuthHandler] BodyParser error: %v", err)
		return fiber.NewError(http.StatusBadRequest, "Invalid request body")
	}
	log.Printf("[TelegramAuthHandler] Auth request: %+v", body)
	user, err := userStore.FindOrCreateByTelegram(context.Background(), body.TelegramID, body.Username, body.FirstName, body.LastName)
	if err != nil {
		log.Printf("[TelegramAuthHandler] FindOrCreateByTelegram error: %v", err)
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	log.Printf("[TelegramAuthHandler] Auth success: %+v", user)
	return c.JSON(user)
}

func GetProfileHandler(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return err
	}
	user, err := userStore.GetByID(context.Background(), userID)
	if err != nil {
		return fiber.NewError(http.StatusNotFound, "User not found")
	}
	return c.JSON(user)
}

func UpdateProfileHandler(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return err
	}
	type req struct {
		Username  string `json:"username"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
	}
	var body req
	if err := c.BodyParser(&body); err != nil {
		return fiber.NewError(http.StatusBadRequest, "Invalid request body")
	}
	if err := userStore.UpdateProfile(context.Background(), userID, body.Username, body.FirstName, body.LastName); err != nil {
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	return c.SendStatus(http.StatusNoContent)
}

func RegisterUserRoutes(router fiber.Router) {
	router.Post("/auth/telegram", TelegramAuthHandler)
	router.Get("/user/me", GetProfileHandler)
	router.Put("/user/me", UpdateProfileHandler)
}

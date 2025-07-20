package api

import (
	"net/http"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

func getUserID(c *fiber.Ctx) (int64, error) {
	userIDStr := c.Get("X-User-ID")
	if userIDStr == "" {
		return 0, fiber.NewError(http.StatusUnauthorized, "User ID not provided")
	}
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		return 0, fiber.NewError(http.StatusBadRequest, "Invalid User ID")
	}
	return userID, nil
}

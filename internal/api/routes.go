package api

import (
	"github.com/gofiber/fiber/v2"
)

func RegisterRoutes(app *fiber.App) {
	// Add global error handler middleware
	app.Use(func(c *fiber.Ctx) error {
		err := c.Next()
		if err != nil {
			// Standardize error response
			code := fiber.StatusInternalServerError
			msg := "Internal Server Error"
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
				msg = e.Message
			} else if err != nil {
				msg = err.Error()
			}
			return c.Status(code).JSON(fiber.Map{
				"error":   true,
				"message": msg,
			})
		}
		return nil
	})

	api := app.Group("/api")

	RegisterUserRoutes(api)
	RegisterRoomRoutes(api)
	RegisterSessionRoutes(api)
	RegisterCardRoutes(api)
	RegisterWalletRoutes(api)
	RegisterAuditRoutes(api)
	RegisterHealthRoutes(api)
}

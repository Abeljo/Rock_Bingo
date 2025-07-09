package api

import (
	"github.com/gofiber/fiber/v2"
)

func RegisterRoutes(app *fiber.App) {
	api := app.Group("/api")

	RegisterUserRoutes(api)
	RegisterRoomRoutes(api)
	RegisterSessionRoutes(api)
	RegisterCardRoutes(api)
	RegisterWalletRoutes(api)
	RegisterAuditRoutes(api)
	RegisterHealthRoutes(api)
}

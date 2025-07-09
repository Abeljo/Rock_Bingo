package api

import (
	"github.com/gofiber/fiber/v2"
)

func RegisterHealthRoutes(router fiber.Router) {
	router.Get("/health", HealthHandler)
	router.Get("/version", VersionHandler)
}

func HealthHandler(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"status": "ok"})
}

func VersionHandler(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"version": "1.0.0"})
}

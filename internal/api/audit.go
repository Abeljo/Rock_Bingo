package api

import (
	"context"
	"net/http"
	"rockbingo/internal/db"

	"github.com/gofiber/fiber/v2"
)

var auditStore *db.AuditStore

func InitAuditHandlers(store *db.AuditStore) {
	auditStore = store
}

func GetAuditLogsHandler(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return err
	}
	logs, err := auditStore.GetAuditLogs(context.Background(), userID)
	if err != nil {
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(logs)
}

func RegisterAuditRoutes(router fiber.Router) {
	router.Get("/audit", GetAuditLogsHandler)
}

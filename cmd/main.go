package main

import (
	"log"
	"os"
	"rockbingo/internal/api"
	"rockbingo/internal/db"
	"rockbingo/internal/telegrambot"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/jmoiron/sqlx"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	_ = godotenv.Load()
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable not set")
	}

	if err := db.MigrateDB(dbURL); err != nil {
		log.Fatalf("Migration error: %v", err)
	}

	database, err := sqlx.Connect("postgres", dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	// Initialize stores
	userStore := db.NewUserStore(database)
	roomStore := db.NewRoomStore(database)
	sessionStore := db.NewSessionStore(database)
	cardStore := db.NewCardStore(database)
	walletStore := db.NewWalletStore(database)
	auditStore := db.NewAuditStore(database)

	// Initialize handlers
	api.InitUserHandlers(userStore)
	api.InitRoomHandlers(roomStore)
	api.InitSessionHandlers(sessionStore)
	api.InitCardHandlers(cardStore)
	api.InitWalletHandlers(walletStore)
	api.InitAuditHandlers(auditStore)

	// Prepare config for bot
	botConfig := &telegrambot.Config{
		BotToken:   os.Getenv("TELEGRAM_BOT_TOKEN"),
		APIBase:    os.Getenv("BINGO_API_BASE_URL"),
		MiniAppURL: os.Getenv("MINIAPP_URL"),
	}
	go telegrambot.StartBot(botConfig)

	app := fiber.New()

	// Logger middleware
	app.Use(func(c *fiber.Ctx) error {
		log.Printf("%s %s", c.Method(), c.OriginalURL())
		return c.Next()
	})
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*", // or "*" to allow all
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
	}))
	// Register all API routes
	api.RegisterRoutes(app)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}
	log.Printf("Server running on port %s", port)
	log.Fatal(app.Listen(":" + port))
}

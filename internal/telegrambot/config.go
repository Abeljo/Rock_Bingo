package telegrambot

import (
	"os"
)

type Config struct {
	BotToken   string
	APIBase    string
	MiniAppURL string
}

func LoadConfig() (*Config, error) {
	return &Config{
		BotToken:   os.Getenv("TELEGRAM_BOT_TOKEN"),
		APIBase:    os.Getenv("API_BASE"),
		MiniAppURL: os.Getenv("MINIAPP_URL"),
	}, nil
}

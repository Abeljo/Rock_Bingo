package telegrambot

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"
	"sync"
	"time"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
)

var (
	mainMenu = [][]tgbotapi.InlineKeyboardButton{
		{
			tgbotapi.NewInlineKeyboardButtonData("Play", "play"),
			tgbotapi.NewInlineKeyboardButtonData("Deposit", "deposit"),
			tgbotapi.NewInlineKeyboardButtonData("Withdraw", "withdraw"),
		},
		{
			tgbotapi.NewInlineKeyboardButtonData("Check Balance", "balance"),
			tgbotapi.NewInlineKeyboardButtonData("Instructions", "instructions"),
		},
		{
			tgbotapi.NewInlineKeyboardButtonData("Invite", "invite"),
		},
	}

	playMenu = [][]tgbotapi.InlineKeyboardButton{
		{
			tgbotapi.NewInlineKeyboardButtonData("10 ETB", "play_10"),
			tgbotapi.NewInlineKeyboardButtonData("25 ETB", "play_25"),
		},
		{
			tgbotapi.NewInlineKeyboardButtonData("50 ETB", "play_50"),
			tgbotapi.NewInlineKeyboardButtonData("100 ETB", "play_100"),
		},
	}

	userDepositState = struct {
		sync.RWMutex
		m map[int64]bool
	}{m: make(map[int64]bool)}
	userWithdrawState = struct {
		sync.RWMutex
		m map[int64]bool
	}{m: make(map[int64]bool)}
	userIDMap = struct {
		sync.RWMutex
		m map[int64]int64
	}{m: make(map[int64]int64)} // telegramID -> internal user ID
)

type Room struct {
	ID int64 `json:"id"`
}

func StartBot(config *Config) {
	if config.BotToken == "" {
		log.Println("TELEGRAM_BOT_TOKEN not set, bot will not start.")
		return
	}
	bot, err := tgbotapi.NewBotAPI(config.BotToken)
	if err != nil {
		log.Println("Telegram bot error:", err)
		return
	}
	bot.Debug = true
	log.Printf("Telegram bot authorized on account %s", bot.Self.UserName)

	u := tgbotapi.NewUpdate(0)
	u.Timeout = 60
	updates := bot.GetUpdatesChan(u)

	for update := range updates {
		if update.Message != nil {
			if update.Message.IsCommand() {
				switch update.Message.Command() {
				case "start":
					registerOrSyncUser(config, update.Message.From)
					sendWelcome(bot, update.Message)
				}
			} else if getDepositState(update.Message.From.ID) {
				amount := update.Message.Text
				msg := handleDeposit(config, bot, update.Message, amount)
				bot.Send(msg)
				setDepositState(update.Message.From.ID, false)
			} else if getWithdrawState(update.Message.From.ID) {
				amount := update.Message.Text
				msg := handleWithdraw(config, bot, update.Message, amount)
				bot.Send(msg)
				setWithdrawState(update.Message.From.ID, false)
			}
		}
		if update.CallbackQuery != nil {
			registerOrSyncUser(config, update.CallbackQuery.From)
			handleCallback(config, bot, update.CallbackQuery)
		}
	}
}

func getDepositState(userID int64) bool {
	userDepositState.RLock()
	defer userDepositState.RUnlock()
	return userDepositState.m[userID]
}

func setDepositState(userID int64, state bool) {
	userDepositState.Lock()
	defer userDepositState.Unlock()
	userDepositState.m[userID] = state
}

func getWithdrawState(userID int64) bool {
	userWithdrawState.RLock()
	defer userWithdrawState.RUnlock()
	return userWithdrawState.m[userID]
}

func setWithdrawState(userID int64, state bool) {
	userWithdrawState.Lock()
	defer userWithdrawState.Unlock()
	userWithdrawState.m[userID] = state
}

func registerOrSyncUser(config *Config, user *tgbotapi.User) {
	if config.APIBase == "" {
		return
	}
	body := map[string]interface{}{
		"telegram_id": user.ID,
		"username":    user.UserName,
		"first_name":  user.FirstName,
		"last_name":   user.LastName,
	}
	b, _ := json.Marshal(body)
	resp, err := http.Post(fmt.Sprintf("%s/api/auth/telegram", config.APIBase), "application/json", bytes.NewBuffer(b))
	if err != nil || resp.StatusCode != 200 {
		return
	}
	defer resp.Body.Close()
	var regResp struct {
		ID int64 `json:"id"`
	}
	_ = json.NewDecoder(resp.Body).Decode(&regResp)
	setInternalUserID(user.ID, regResp.ID)
}

func setInternalUserID(telegramID, internalID int64) {
	userIDMap.Lock()
	defer userIDMap.Unlock()
	userIDMap.m[telegramID] = internalID
}

func getInternalUserID(telegramID int64) int64 {
	userIDMap.RLock()
	defer userIDMap.RUnlock()
	return userIDMap.m[telegramID]
}

func getUserBalance(config *Config, user *tgbotapi.User) (string, error) {
	if config.APIBase == "" {
		return "API not configured", nil
	}
	internalID := getInternalUserID(user.ID)
	if internalID == 0 {
		return "User not registered.", nil
	}
	client := &http.Client{}
	req, _ := http.NewRequest("GET", fmt.Sprintf("%s/api/wallet", config.APIBase), nil)
	req.Header.Set("X-User-ID", fmt.Sprintf("%d", internalID))
	resp, err := client.Do(req)
	if err != nil {
		return "API error", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return "Could not fetch balance", nil
	}
	var wallet struct {
		Balance float64 `json:"balance"`
	}
	body, _ := ioutil.ReadAll(resp.Body)
	_ = json.Unmarshal(body, &wallet)
	return fmt.Sprintf("Your balance: %.2f ETB", wallet.Balance), nil
}

func sendWelcome(bot *tgbotapi.BotAPI, msg *tgbotapi.Message) {
	photo := tgbotapi.NewPhoto(msg.Chat.ID, tgbotapi.FilePath("./logo.jpg"))
	photo.Caption = "🎉 Welcome to Rock Bingo! 🎉\n\nPlay, win, and have fun with friends!"
	photo.ReplyMarkup = tgbotapi.NewInlineKeyboardMarkup(mainMenu...)
	_, err := bot.Send(photo)
	if err != nil {
		log.Println("Failed to send logo.jpg:", err)
		m := tgbotapi.NewMessage(msg.Chat.ID, "Welcome to Rock Bingo! Play, win, and have fun with friends!")
		m.ReplyMarkup = tgbotapi.NewInlineKeyboardMarkup(mainMenu...)
		bot.Send(m)
	}
}

func handleCallback(config *Config, bot *tgbotapi.BotAPI, cb *tgbotapi.CallbackQuery) {
	switch cb.Data {
	case "play":
		msg := tgbotapi.NewMessage(cb.Message.Chat.ID, "Choose your bet amount:")
		msg.ReplyMarkup = tgbotapi.NewInlineKeyboardMarkup(playMenu...)
		bot.Send(msg)
	case "deposit":
		setDepositState(cb.From.ID, true)
		bot.Send(tgbotapi.NewMessage(cb.Message.Chat.ID, "Enter the amount you want to deposit (ETB):"))
	case "balance":
		balance, err := getUserBalance(config, cb.From)
		if err != nil {
			balance = "Could not fetch balance."
		}
		bot.Send(tgbotapi.NewMessage(cb.Message.Chat.ID, balance))
	case "instructions":
		instructions := `📋 *How to Play Rock Bingo* 📋\n\n
1️⃣ *Start*: Tap /start to register and see the main menu.\n
2️⃣ *Deposit*: Click 💰 Deposit to add funds to your wallet.\n
3️⃣ *Play*: Click ▶️ Play, then choose your bet (10, 25, 50, 100 ETB).\n
4️⃣ *Join a Room*: A room will be created for you. Share the invite link with friends!\n
5️⃣ *Wait for Game Start*: When enough players join, the game begins.\n
6️⃣ *Mark Numbers*: As numbers are drawn, tap them on your card.\n
7️⃣ *Claim Bingo*: If you complete a row, column, or diagonal, tap 🏆 Claim Bingo!\n
8️⃣ *Win & Withdraw*: Winners get the prize!\n\nℹ️ *Need help?* Use the Invite button to bring friends, or contact support.\n\n🎉 *Good luck and have fun!* 🎉`
		msg := tgbotapi.NewMessage(cb.Message.Chat.ID, instructions)
		msg.ParseMode = "Markdown"
		bot.Send(msg)
	case "invite":
		inviteLink := generateInviteLink(cb.From.ID)
		bot.Send(tgbotapi.NewMessage(cb.Message.Chat.ID, "Invite your friends with this link: "+inviteLink))
	case "withdraw":
		setWithdrawState(cb.From.ID, true)
		bot.Send(tgbotapi.NewMessage(cb.Message.Chat.ID, "Enter the amount you want to withdraw (ETB):"))
	case "play_10", "play_25", "play_50", "play_100":
		amount := cb.Data[5:]
		miniAppUrl := config.MiniAppURL
		if miniAppUrl == "" {
			miniAppUrl = fmt.Sprintf("https://t.me/%s/rockbingo-miniapp?bet=%s", bot.Self.UserName, amount)
		} else {
			miniAppUrl = fmt.Sprintf("%s?bet=%s", miniAppUrl, amount)
		}
		webAppButton := tgbotapi.NewInlineKeyboardButtonURL("Open Rock Bingo Mini App", miniAppUrl)
		row := tgbotapi.NewInlineKeyboardRow(webAppButton)
		msg := tgbotapi.NewMessage(cb.Message.Chat.ID, fmt.Sprintf("Click below to play Rock Bingo for %s ETB!", amount))
		msg.ReplyMarkup = tgbotapi.NewInlineKeyboardMarkup(row)
		bot.Send(msg)
	default:
		bot.Send(tgbotapi.NewMessage(cb.Message.Chat.ID, "Unknown action."))
	}
	bot.Request(tgbotapi.NewCallback(cb.ID, ""))
}

func handleDeposit(config *Config, bot *tgbotapi.BotAPI, msg *tgbotapi.Message, amountStr string) tgbotapi.MessageConfig {
	amount, err := strconv.ParseFloat(amountStr, 64)
	if err != nil || amount <= 0 {
		return tgbotapi.NewMessage(msg.Chat.ID, "Invalid amount. Please enter a positive number.")
	}
	internalID := getInternalUserID(msg.From.ID)
	if internalID == 0 {
		return tgbotapi.NewMessage(msg.Chat.ID, "User not registered.")
	}
	// Generate a unique transaction_ref using user ID and current timestamp
	transactionRef := fmt.Sprintf("telegram-%d-%d", msg.From.ID, time.Now().UnixNano())
	depReq := map[string]interface{}{
		"amount":          amount,
		"currency":        "ETB",
		"transaction_ref": transactionRef,
		"status":          "completed", // <-- set to completed for auto-credit
	}
	b, _ := json.Marshal(depReq)
	client := &http.Client{}
	req, _ := http.NewRequest("POST", config.APIBase+"/api/deposit", bytes.NewBuffer(b))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-User-ID", fmt.Sprintf("%d", internalID))
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != 200 {
		return tgbotapi.NewMessage(msg.Chat.ID, "Deposit failed. Please try again later.")
	}
	return tgbotapi.NewMessage(msg.Chat.ID, "Deposit request received! Please complete your payment as instructed.")
}

func handleWithdraw(config *Config, bot *tgbotapi.BotAPI, msg *tgbotapi.Message, amountStr string) tgbotapi.MessageConfig {
	amount, err := strconv.ParseFloat(amountStr, 64)
	if err != nil || amount <= 0 {
		return tgbotapi.NewMessage(msg.Chat.ID, "Invalid amount. Please enter a positive number.")
	}
	internalID := getInternalUserID(msg.From.ID)
	if internalID == 0 {
		return tgbotapi.NewMessage(msg.Chat.ID, "User not registered.")
	}
	withdrawReq := map[string]interface{}{
		"amount":      amount,
		"currency":    "ETB",
		"destination": "telegram-withdrawal",
	}
	b, _ := json.Marshal(withdrawReq)
	client := &http.Client{}
	req, _ := http.NewRequest("POST", config.APIBase+"/api/withdraw", bytes.NewBuffer(b))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-User-ID", fmt.Sprintf("%d", internalID))
	resp, err := client.Do(req)
	if err != nil {
		return tgbotapi.NewMessage(msg.Chat.ID, "Withdraw failed. Please try again later.")
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		body, _ := ioutil.ReadAll(resp.Body)
		return tgbotapi.NewMessage(msg.Chat.ID, fmt.Sprintf("Withdraw failed: %s", string(body)))
	}
	return tgbotapi.NewMessage(msg.Chat.ID, fmt.Sprintf("Withdraw request for %.2f ETB received!", amount))
}

func generateInviteLink(roomID int64) string {
	return fmt.Sprintf("https://t.me/YourBotUsername?start=room_%d", roomID)
}

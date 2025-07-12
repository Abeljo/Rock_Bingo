package api

import (
	"context"
	"net/http"
	"rockbingo/internal/db"

	"github.com/gofiber/fiber/v2"
)

var walletStore *db.WalletStore

func InitWalletHandlers(store *db.WalletStore) {
	walletStore = store
}

func GetWalletHandler(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return err
	}
	wallet, err := walletStore.GetWallet(context.Background(), userID)
	if err != nil {
		return fiber.NewError(http.StatusNotFound, "Wallet not found")
	}
	return c.JSON(wallet)
}

func GetTransactionsHandler(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return err
	}
	txs, err := walletStore.GetTransactions(context.Background(), userID)
	if err != nil {
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(txs)
}

func DepositHandler(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return err
	}
	type req struct {
		Amount         float64 `json:"amount"`
		Currency       string  `json:"currency"`
		TransactionRef string  `json:"transaction_ref"`
		Status         string  `json:"status"`
	}
	var body req
	if err := c.BodyParser(&body); err != nil {
		return fiber.NewError(http.StatusBadRequest, "Invalid request body")
	}
	dep, err := walletStore.CreateDeposit(context.Background(), userID, body.Amount, body.Currency, body.TransactionRef, body.Status)
	if err != nil {
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	// Auto-credit wallet if status is completed
	if body.Status == "completed" {
		// Update wallet balance
		_, werr := walletStore.DB.ExecContext(context.Background(), `
			UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2
		`, body.Amount, userID)
		if werr != nil {
			return fiber.NewError(http.StatusInternalServerError, werr.Error())
		}

		// Create transaction record
		_, terr := walletStore.DB.ExecContext(context.Background(), `
			INSERT INTO transactions (user_id, type, amount, created_at)
			VALUES ($1, 'deposit', $2, NOW())
		`, userID, body.Amount)
		if terr != nil {
			return fiber.NewError(http.StatusInternalServerError, terr.Error())
		}
	}
	return c.JSON(dep)
}

func RegisterWalletRoutes(router fiber.Router) {
	router.Get("/wallet", GetWalletHandler)
	router.Get("/transactions", GetTransactionsHandler)
	router.Post("/deposit", DepositHandler)
	router.Post("/withdraw", WithdrawHandler)
}

func WithdrawHandler(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return err
	}
	type req struct {
		Amount      float64 `json:"amount"`
		Currency    string  `json:"currency"`
		Destination string  `json:"destination"`
	}
	var body req
	if err := c.BodyParser(&body); err != nil {
		return fiber.NewError(http.StatusBadRequest, "Invalid request body")
	}
	// Check balance
	wallet, err := walletStore.GetWallet(context.Background(), userID)
	if err != nil {
		return fiber.NewError(http.StatusNotFound, "Wallet not found")
	}
	if wallet.Balance < body.Amount {
		return fiber.NewError(http.StatusBadRequest, "Insufficient balance")
	}
	// Deduct balance
	_, werr := walletStore.DB.ExecContext(context.Background(), `
		UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE user_id = $2
	`, body.Amount, userID)
	if werr != nil {
		return fiber.NewError(http.StatusInternalServerError, werr.Error())
	}
	// Create transaction
	_, terr := walletStore.DB.ExecContext(context.Background(), `
		INSERT INTO transactions (user_id, type, amount, created_at)
		VALUES ($1, 'withdraw', $2, NOW())
	`, userID, body.Amount)
	if terr != nil {
		return fiber.NewError(http.StatusInternalServerError, terr.Error())
	}
	return c.JSON(fiber.Map{"status": "success", "amount": body.Amount, "currency": body.Currency})
}

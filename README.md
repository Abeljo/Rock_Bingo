# Rock Bingo

**Rock Bingo** is a full-featured online Bingo game platform built with Go, featuring:
- A RESTful API (Go, Fiber, PostgreSQL, sqlx)
- A Telegram bot for user interaction (registration, wallet, play, deposit, withdraw, etc.)
- Real-time and user-centric game and wallet management

---

## Features

- **User Registration & Authentication** (via Telegram)
- **Room Management** (create, join, leave, start, get players/cards)
- **Game Sessions** (start, draw number, mark, claim bingo, get winners)
- **Bingo Cards** (get my card, get all cards in room/session)
- **Wallet & Transactions** (deposit, withdraw, check balance, transaction history)
- **Audit Logging**
- **Health & Version Endpoints**
- **Telegram Bot Integration** (Play, Deposit, Withdraw, Check Balance, Instructions, Invite)
- **Database Migrations** (PostgreSQL)

---

## Project Structure

```
.
├── cmd/                    # Main entrypoint (main.go)
├── internal/
│   ├── api/                # API route handlers (user, room, session, wallet, etc.)
│   ├── db/                 # Database models, stores, migrations
│   ├── telegrambot/        # Telegram bot logic and handlers
│   ├── game/               # (Game logic, if any)
│   └── telegram/           # (Legacy or extra Telegram code, if any)
├── web/                    # (Static assets or frontend, if any)
├── logo.jpg                # Logo used by the Telegram bot
├── go.mod / go.sum         # Go modules and dependencies
└── .env                    # Environment variables (not committed)
```

---

## Getting Started

### 1. **Clone the Repository**

```sh
git clone <your-repo-url>
cd Rock_Bingo
```

### 2. **Set Up Environment Variables**

Create a `.env` file in the root directory with the following variables:

```
DATABASE_URL=postgres://user:password@localhost:5432/rockbingo?sslmode=disable
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
BINGO_API_BASE_URL=http://localhost:3000
PORT=3000
```

- `DATABASE_URL`: PostgreSQL connection string
- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token from BotFather
- `BINGO_API_BASE_URL`: Base URL for the API (used by the bot)
- `PORT`: Port for the API server (default: 3000)

### 3. **Install Dependencies**

```sh
go mod download
```

### 4. **Run Database Migrations**

Migrations are run automatically on server start, but you can also run them manually if needed.

### 5. **Start the Server and Bot**

```sh
go run ./cmd/main.go
```

- The API server will start on the specified port.
- The Telegram bot will start in a background goroutine.

---

## API Overview

- **Base URL:** `http://localhost:3000/api/`

### **Key Endpoints**

| Endpoint                | Method | Description                        |
|-------------------------|--------|------------------------------------|
| `/auth/telegram`        | POST   | Register/login via Telegram        |
| `/profile`              | GET    | Get user profile                   |
| `/profile`              | PUT    | Update user profile                |
| `/rooms`                | POST   | Create room                        |
| `/rooms`                | GET    | List rooms                         |
| `/rooms/:id`            | GET    | Get room info                      |
| `/rooms/:id/join`       | POST   | Join room                          |
| `/rooms/:id/leave`      | POST   | Leave room                         |
| `/rooms/:id/start`      | POST   | Start room                         |
| `/rooms/:id/players`    | GET    | Get players in room                |
| `/rooms/:id/cards`      | GET    | Get cards in room                  |
| `/rooms/:id/bet`        | POST   | Place bet in room                  |
| `/session/:id`          | GET    | Get session info                   |
| `/session/:id/draw`     | POST   | Draw number                        |
| `/session/:id/mark`     | POST   | Mark number on card                |
| `/session/:id/claim`    | POST   | Claim bingo                        |
| `/session/:id/winners`  | GET    | Get winners                        |
| `/wallet`               | GET    | Get wallet info                    |
| `/transactions`         | GET    | Get transaction history            |
| `/deposit`              | POST   | Deposit funds                      |
| `/withdraw`             | POST   | Withdraw funds                     |
| `/audit`                | GET    | Get audit logs                     |
| `/health`               | GET    | Health check                       |
| `/version`              | GET    | Version info                       |

**All endpoints (except `/auth/telegram`) require the `X-User-ID` header.**

---

## Telegram Bot Features

- **/start**: Register/login and show main menu (with logo)
- **Play**: Create room, get invite link, launch mini app (future)
- **Deposit**: Enter amount, auto-credit wallet (for demo)
- **Withdraw**: Enter amount, auto-deduct wallet
- **Check Balance**: Show wallet balance
- **Instructions**: How to play, with emoji-rich formatting
- **Invite**: Get invite link to share with friends

**Note:** The bot uses the API for all user actions. All wallet operations are reflected in both the bot and API.

---

## Database Schema

- **Users, Rooms, Cards, Sessions, Numbers, Winners, UserBets**
- **Wallets, Transactions, PaymentDeposits**
- **AuditLogs**

See `internal/db/migrations/0001_create_tables.up.sql` for full schema.

---

## Assets

- `logo.jpg` is required in the project root for the Telegram bot welcome message.

---

## Dependencies

- [Go Fiber](https://gofiber.io/) (web framework)
- [sqlx](https://github.com/jmoiron/sqlx) (DB access)
- [PostgreSQL](https://www.postgresql.org/) (database)
- [go-telegram-bot-api](https://github.com/go-telegram-bot-api/telegram-bot-api) (Telegram bot)
- [godotenv](https://github.com/joho/godotenv) (env file support)
- [golang-migrate/migrate](https://github.com/golang-migrate/migrate) (migrations)

---

## Development & Testing

- Use the Telegram bot for all user flows.
- Use API endpoints for direct testing (with tools like Postman or PowerShell).
- All deposits/withdrawals are auto-processed for demo purposes.
- For real payment integration, update the deposit/withdraw logic to require manual or webhook confirmation.

---

## License

-- to be licensed under Abel or Rock

---

## Credits

Developed by [Abel Yosef, abeljo86@gmail.com].  
Logo by [Rock Bingo].

---

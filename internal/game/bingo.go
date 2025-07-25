package game

import (
	"encoding/json"
	"math/rand"
	"time"
)

// Seed rand once globally
func init() {
	rand.Seed(time.Now().UnixNano())
}

// Card represents a Bingo card with its grid and marked numbers.
type Card struct {
	Grid  [5][5]int  `json:"grid"`
	Marks [5][5]bool `json:"marks"`
}

// NewCard creates a 5x5 Bingo card with numbers from traditional Bingo ranges per column
// and center cell marked as free space (0).
func NewCard() *Card {
	card := &Card{}

	// Define number ranges per column
	ranges := [5][2]int{
		{1, 15},  // B
		{16, 30}, // I
		{31, 45}, // N
		{46, 60}, // G
		{61, 75}, // O
	}

	for col := 0; col < 5; col++ {
		// Generate 5 unique numbers within the column range
		numRange := ranges[col][1] - ranges[col][0] + 1
		nums := rand.Perm(numRange)[:5] // first 5 unique numbers from range size

		for row := 0; row < 5; row++ {
			card.Grid[row][col] = nums[row] + ranges[col][0] // shift by start of range
		}
	}

	// Center cell (2,2) is free space: number = 0 and marked
	card.Grid[2][2] = 0
	card.Marks[2][2] = true

	return card
}

// BingoHeaders returns the BINGO column headers.
func BingoHeaders() [5]string {
	return [5]string{"B", "I", "N", "G", "O"}
}

// MarkNumber marks a number on the card if it exists.
func (c *Card) MarkNumber(number int) {
	for i := 0; i < 5; i++ {
		for j := 0; j < 5; j++ {
			if c.Grid[i][j] == number {
				c.Marks[i][j] = true
				return
			}
		}
	}
}

// ToJSON converts the card to its JSON representation.
func (c *Card) ToJSON() ([]byte, error) {
	return json.Marshal(c)
}

// GenerateCallouts creates a shuffled list of numbers from 1 to 75.
func GenerateCallouts() []int {
	nums := make([]int, 75)
	for i := 0; i < 75; i++ {
		nums[i] = i + 1
	}
	rand.Shuffle(len(nums), func(i, j int) {
		nums[i], nums[j] = nums[j], nums[i]
	})
	return nums
}

// GenerateAvailableCards creates 100 unique bingo cards for a room.
func GenerateAvailableCards() []*Card {
	cards := make([]*Card, 0, 100)
	cardSet := make(map[string]bool)

	for len(cards) < 100 {
		card := NewCard()
		jsonBytes, err := card.ToJSON()
		if err != nil {
			continue // skip invalid cards, rare but safe
		}
		key := string(jsonBytes)
		if !cardSet[key] {
			cardSet[key] = true
			cards = append(cards, card)
		}
	}

	return cards
}

// HasWinningPattern checks if the card has a winning bingo pattern.
func (c *Card) HasWinningPattern() bool {
	// Check rows
	for i := 0; i < 5; i++ {
		rowComplete := true
		for j := 0; j < 5; j++ {
			if !c.Marks[i][j] {
				rowComplete = false
				break
			}
		}
		if rowComplete {
			return true
		}
	}

	// Check columns
	for j := 0; j < 5; j++ {
		colComplete := true
		for i := 0; i < 5; i++ {
			if !c.Marks[i][j] {
				colComplete = false
				break
			}
		}
		if colComplete {
			return true
		}
	}

	// Check diagonal (top-left to bottom-right)
	diagComplete := true
	for i := 0; i < 5; i++ {
		if !c.Marks[i][i] {
			diagComplete = false
			break
		}
	}
	if diagComplete {
		return true
	}

	// Check diagonal (top-right to bottom-left)
	diagComplete = true
	for i := 0; i < 5; i++ {
		if !c.Marks[i][4-i] {
			diagComplete = false
			break
		}
	}
	if diagComplete {
		return true
	}

	return false
}

// ValidateBingo validates the card against the drawn numbers.
func (c *Card) ValidateBingo(drawnNumbers []int) bool {
	// Create a map of drawn numbers for quick lookup
	drawnMap := make(map[int]bool)
	for _, num := range drawnNumbers {
		drawnMap[num] = true
	}

	// Check if all marked numbers were actually drawn
	for i := 0; i < 5; i++ {
		for j := 0; j < 5; j++ {
			if c.Marks[i][j] {
				// Ignore center free space cell with 0
				if c.Grid[i][j] != 0 && !drawnMap[c.Grid[i][j]] {
					return false // Marked number was not drawn
				}
			}
		}
	}

	return c.HasWinningPattern()
}

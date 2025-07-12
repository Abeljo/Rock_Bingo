package game

import (
	"encoding/json"
	"math/rand"
	"time"
)

// Card represents a Bingo card with its grid and marked numbers.
type Card struct {
	Grid  [5][5]int  `json:"grid"`
	Marks [5][5]bool `json:"marks"`
}

// NewCard creates a 5x5 Bingo card with 25 random numbers from 1-100.
func NewCard() *Card {
	rand.Seed(time.Now().UnixNano())
	card := &Card{}

	// Generate 25 unique random numbers from 1-100
	numbers := rand.Perm(100)
	for i := 0; i < 25; i++ {
		numbers[i] = numbers[i] + 1 // Convert 0-99 to 1-100
	}

	// Fill the 5x5 grid with the 25 numbers
	index := 0
	for i := 0; i < 5; i++ {
		for j := 0; j < 5; j++ {
			card.Grid[i][j] = numbers[index]
			index++
		}
	}

	return card
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

// GenerateCallouts creates a shuffled list of numbers from 1 to 100.
func GenerateCallouts() []int {
	rand.Seed(time.Now().UnixNano())
	nums := make([]int, 100)
	for i := 0; i < 100; i++ {
		nums[i] = i + 1
	}
	rand.Shuffle(len(nums), func(i, j int) {
		nums[i], nums[j] = nums[j], nums[i]
	})
	return nums
}

// GenerateAvailableCards creates 100 unique bingo cards for a room.
func GenerateAvailableCards() []*Card {
	cards := make([]*Card, 100)
	for i := 0; i < 100; i++ {
		cards[i] = NewCard()
	}
	return cards
}

// HasWinningPattern checks if the card has a winning bingo pattern
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

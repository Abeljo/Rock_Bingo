package game

import (
	"encoding/json"
	"math/rand"
	"time"
)

// Card represents a Bingo card with its grid and marked numbers.
type Card struct {
	Grid  [5][5]int `json:"grid"`
	Marks [5][5]bool  `json:"marks"`
}

// NewCard creates a standard 5x5 Bingo card.
// The center is a free space (marked as 0).
func NewCard() *Card {
	rand.Seed(time.Now().UnixNano())
	card := &Card{}

	// B column (1-15)
	colB := rand.Perm(15)
	for i := 0; i < 5; i++ {
		card.Grid[i][0] = colB[i] + 1
	}

	// I column (16-30)
	colI := rand.Perm(15)
	for i := 0; i < 5; i++ {
		card.Grid[i][1] = colI[i] + 16
	}

	// N column (31-45)
	colN := rand.Perm(15)
	for i := 0; i < 4; i++ {
		if i < 2 {
			card.Grid[i][2] = colN[i] + 31
		} else {
			card.Grid[i+1][2] = colN[i] + 31
		}
	}
	card.Grid[2][2] = 0 // Free space
	card.Marks[2][2] = true // Mark free space

	// G column (46-60)
	colG := rand.Perm(15)
	for i := 0; i < 5; i++ {
		card.Grid[i][3] = colG[i] + 46
	}

	// O column (61-75)
	colO := rand.Perm(15)
	for i := 0; i < 5; i++ {
		card.Grid[i][4] = colO[i] + 61
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

// GenerateCallouts creates a shuffled list of numbers from 1 to 75.
func GenerateCallouts() []int {
	rand.Seed(time.Now().UnixNano())
	nums := make([]int, 75)
	for i := 0; i < 75; i++ {
		nums[i] = i + 1
	}
	rand.Shuffle(len(nums), func(i, j int) {
		nums[i], nums[j] = nums[j], nums[i]
	})
	return nums
}
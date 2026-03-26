package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

type SheetsResponse struct {
	Range  string     `json:"range"`
	Values [][]string `json:"values"`
}

type User struct {
	// ID           int    `json:"id"`
	Name         string `json:"name"`
	School       string `json:"school"`
	Participants int    `json:"participants"`
	Mentor       string `json:"mentor"`
	Status       int    `json:"status"`
}

func fetchAndUpdate(db *sql.DB) {
	apiKey := "AIzaSyC4YF1lNOLcfJkcGmW5ZSprxHuRGGMpQTs"
	sheetID := "1LpHmp_aoMOj-96CO6vauaSmixg3Y6ptz-q0y877nPvU"

	// https://forms.gle/ZpRmhaF7dgahKP5WA

	url := fmt.Sprintf(
		"https://sheets.googleapis.com/v4/spreadsheets/%s/values/Form responses 1?key=%s",
		sheetID, apiKey,
	)

	resp, err := http.Get(url)
	if err != nil {
		fmt.Println("Error fetching sheet:", err)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var data SheetsResponse
	if err := json.Unmarshal(body, &data); err != nil {
		fmt.Println("Error parsing JSON:", err)
		return
	}

	for i, row := range data.Values {
		if i == 0 { // skip header
			continue
		}

		// Check if the team already exists
		var exists bool
		err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM teams WHERE name = ?)", row[1]).Scan(&exists)
		if err != nil {
			fmt.Println("DB check error:", err)
			continue
		}
		if exists {
			continue
		}

		// Parse time
		layout := "02/01/2006 15:04:05"
		t, err := time.Parse(layout, row[0])
		if err != nil {
			t = time.Now()
		}

		status := 0

		participants, err := strconv.Atoi(row[3])
		if err != nil {
			fmt.Println("Not a valid integer:", row[3])
			participants = 0
			status = 2
		}

		// Insert into DB
		_, err = db.Exec(
			"INSERT INTO teams (name, school, participants, mentor, status, time) VALUES (?, ?, ?, ?, ?, ?)",
			row[1], row[2], participants, row[4], status, t,
		)
		if err != nil {
			fmt.Println("DB insert error:", err)
			continue
		}
		fmt.Println("Inserted team:", row[1])
	}
}

func main() {
	db, err := sql.Open("sqlite3", "./test_db.db")
	if err != nil {
		panic(err)
	}
	defer db.Close()

	query := `
	CREATE TABLE IF NOT EXISTS teams (
		id INT AUTO_INCREMENT PRIMARY KEY,
		name VARCHAR(255),
		school VARCHAR(255),
		participants INT,
		mentor VARCHAR(255),
		status INT,
		time DATETIME
	);
	`
	_, err = db.Exec(query)
	if err != nil {
		panic(err)
	}

	go func() {
		ticker := time.NewTicker(20 * time.Second) // refresh every 20s
		defer ticker.Stop()

		for {
			fetchAndUpdate(db)
			<-ticker.C
		}
	}()

	http.HandleFunc("/api/users", func(w http.ResponseWriter, r *http.Request) {
		rows, err := db.Query("SELECT name, school, participants, mentor, status FROM teams")
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		defer rows.Close()

		var users []User
		for rows.Next() {
			var u User
			if err := rows.Scan(&u.Name, &u.School, &u.Participants, &u.Mentor, &u.Status); err != nil {
				http.Error(w, err.Error(), 500)
				return
			}
			users = append(users, u)
		}
		w.Header().Set("Access-Control-Allow-Origin", "*") // allow all origins
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(users)
	})

	fmt.Println("Server running on :8080")
	http.ListenAndServe(":8080", nil)
}

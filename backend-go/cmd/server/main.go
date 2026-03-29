package main

import (
	"context"
	"log"

	"bigdata_zhoc/backend-go/internal/config"
	"bigdata_zhoc/backend-go/internal/db"
	"bigdata_zhoc/backend-go/internal/monitor"
	"bigdata_zhoc/backend-go/internal/router"

	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()

	database, err := db.Open(cfg.DatabasePath)
	if err != nil {
		log.Fatalf("open db failed: %v", err)
	}

	go monitor.StartAgentOfflineMonitor(context.Background(), database, cfg.AgentOfflineTimeout, cfg.AgentOfflineCheckInterval)

	r := router.New(cfg, database)
	log.Printf("Spark Lab Go Backend running on http://localhost:%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

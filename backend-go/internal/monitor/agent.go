package monitor

import (
	"context"
	"log"
	"time"

	"bigdata_zhoc/backend-go/internal/model"

	"gorm.io/gorm"
)

func StartAgentOfflineMonitor(ctx context.Context, db *gorm.DB, timeout time.Duration, interval time.Duration) {
	if timeout <= 0 {
		timeout = 10 * time.Second
	}
	if interval <= 0 {
		interval = 5 * time.Second
	}

	checkOnce := func() {
		now := time.Now()
		cutoff := now.Add(-timeout)

		res := db.Model(&model.Server{}).
			Where("status = ? AND lastCheckAt < ?", "online", cutoff).
			Updates(map[string]any{
				"status":    "offline",
				"updatedAt": now,
			})
		if res.Error != nil {
			log.Printf("agent offline monitor failed: %v", res.Error)
			return
		}
		if res.RowsAffected > 0 {
			log.Printf("agent offline monitor: %d server(s) marked offline", res.RowsAffected)
		}
	}

	checkOnce()

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			checkOnce()
		}
	}
}

package config

import (
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Port                     string
	FrontendURL              string
	JWTSecret                string
	JWTExpires               string
	DatabasePath string
	AgentOfflineTimeout      time.Duration
	AgentOfflineCheckInterval time.Duration
}

func Load() *Config {
	port := getEnv("PORT", "3001")
	frontend := getEnv("FRONTEND_URL", "http://localhost:3000")
	jwtSecret := getEnv("JWT_SECRET", "your-secret-key")
	jwtExpires := getEnv("JWT_EXPIRES_IN", "7d")
	databaseURL := getEnv("DATABASE_URL", "file:../backend/prisma/spark_lab.db")
	agentOfflineTimeout := getDurationEnv("AGENT_OFFLINE_TIMEOUT", 10*time.Second)
	agentOfflineCheckInterval := getDurationEnv("AGENT_OFFLINE_CHECK_INTERVAL", 5*time.Second)

	return &Config{
		Port:                      port,
		FrontendURL:               frontend,
		JWTSecret:                 jwtSecret,
		JWTExpires:                jwtExpires,
		DatabasePath:              normalizeDBPath(databaseURL),
		AgentOfflineTimeout:       agentOfflineTimeout,
		AgentOfflineCheckInterval: agentOfflineCheckInterval,
	}
}

func normalizeDBPath(databaseURL string) string {
	if strings.HasPrefix(databaseURL, "file:") {
		return strings.TrimPrefix(databaseURL, "file:")
	}
	return databaseURL
}

func getEnv(key, fallback string) string {
	v := os.Getenv(key)
	if strings.TrimSpace(v) == "" {
		return fallback
	}
	return v
}

func getDurationEnv(key string, fallback time.Duration) time.Duration {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return fallback
	}

	if d, err := time.ParseDuration(v); err == nil && d > 0 {
		return d
	}

	if n, err := strconv.Atoi(v); err == nil && n > 0 {
		return time.Duration(n) * time.Second
	}

	return fallback
}

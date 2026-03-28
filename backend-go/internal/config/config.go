package config

import (
	"os"
	"strings"
)

type Config struct {
	Port        string
	FrontendURL string
	JWTSecret   string
	JWTExpires  string
	DatabasePath string
}

func Load() *Config {
	port := getEnv("PORT", "3001")
	frontend := getEnv("FRONTEND_URL", "http://localhost:3000")
	jwtSecret := getEnv("JWT_SECRET", "your-secret-key")
	jwtExpires := getEnv("JWT_EXPIRES_IN", "7d")
	databaseURL := getEnv("DATABASE_URL", "file:../backend/prisma/spark_lab.db")

	return &Config{
		Port:         port,
		FrontendURL:  frontend,
		JWTSecret:    jwtSecret,
		JWTExpires:   jwtExpires,
		DatabasePath: normalizeDBPath(databaseURL),
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

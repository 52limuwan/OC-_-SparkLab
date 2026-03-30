package db

import (
	"bigdata_zhoc/backend-go/internal/model"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func Open(path string) (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open(path), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	err = db.AutoMigrate(
		&model.User{},
		&model.Course{},
		&model.Lab{},
		&model.Step{},
		&model.Enrollment{},
		&model.Submission{},
		&model.Container{},
		&model.Snapshot{},
		&model.Server{},
	)
	if err != nil {
		return nil, err
	}

	return db, nil
}

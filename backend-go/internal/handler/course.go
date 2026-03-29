package handler

import (
	"net/http"

	"bigdata_zhoc/backend-go/internal/model"

	"github.com/gin-gonic/gin"
)

type courseResp struct {
	ID          string  `json:"id"`
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Cover       *string `json:"cover,omitempty"`
	Difficulty  string  `json:"difficulty"`
	Duration    int     `json:"duration"`
	IsPublished bool    `json:"isPublished"`
	CreatedAt   int64   `json:"createdAt"`
	UpdatedAt   int64   `json:"updatedAt"`
	LabCount    int     `json:"labCount"`
	IsEnrolled  bool    `json:"isEnrolled"`
}

type courseRecord struct {
	ID          string  `gorm:"column:id"`
	Title       string  `gorm:"column:title"`
	Description string  `gorm:"column:description"`
	Cover       *string `gorm:"column:cover"`
	Difficulty  string  `gorm:"column:difficulty"`
	Duration    int     `gorm:"column:duration"`
	IsPublished bool    `gorm:"column:isPublished"`
	CreatedAt   int64   `gorm:"column:createdAt"`
	UpdatedAt   int64   `gorm:"column:updatedAt"`
}

type labSummary struct {
	ID          string  `gorm:"column:id" json:"id"`
	CourseID    string  `gorm:"column:courseId" json:"courseId"`
	Title       string  `gorm:"column:title" json:"title"`
	Description string  `gorm:"column:description" json:"description"`
	Difficulty  string  `gorm:"column:difficulty" json:"difficulty"`
	Order       int     `gorm:"column:order" json:"order"`
	Points      int     `gorm:"column:points" json:"points"`
	TimeLimit   int     `gorm:"column:timeLimit" json:"timeLimit"`
	DockerImage string  `gorm:"column:dockerImage" json:"dockerImage"`
	ServerID    *string `gorm:"column:serverId" json:"serverId,omitempty"`
}

func (h *Handler) GetCourses(c *gin.Context) {
	uid, hasUser := userIDFromCtx(c)
	role := userRoleFromCtx(c)

	var courses []courseRecord
	q := h.db.Table("courses").
		Select("id, title, description, cover, difficulty, duration, isPublished, cast(createdAt as integer) as createdAt, cast(updatedAt as integer) as updatedAt").
		Order("createdAt desc")
	if role != "ADMIN" {
		q = q.Where("isPublished = ?", true)
	}
	if err := q.Find(&courses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Load courses failed"})
		return
	}

	res := make([]courseResp, 0, len(courses))
	for _, course := range courses {
		var labCount int64
		h.db.Table("labs").Where("courseId = ?", course.ID).Count(&labCount)

		isEnrolled := false
		if hasUser {
			var count int64
			h.db.Table("enrollments").Where("userId = ? AND courseId = ?", uid, course.ID).Count(&count)
			isEnrolled = count > 0
		}

		res = append(res, courseResp{
			ID:          course.ID,
			Title:       course.Title,
			Description: course.Description,
			Cover:       course.Cover,
			Difficulty:  course.Difficulty,
			Duration:    course.Duration,
			IsPublished: course.IsPublished,
			CreatedAt:   course.CreatedAt,
			UpdatedAt:   course.UpdatedAt,
			LabCount:    int(labCount),
			IsEnrolled:  isEnrolled,
		})
	}

	c.JSON(http.StatusOK, res)
}

func (h *Handler) GetCourse(c *gin.Context) {
	id := c.Param("id")
	uid, hasUser := userIDFromCtx(c)

	var course courseRecord
	if err := h.db.Table("courses").
		Select("id, title, description, cover, difficulty, duration, isPublished, cast(createdAt as integer) as createdAt, cast(updatedAt as integer) as updatedAt").
		Where("id = ?", id).
		Take(&course).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Course not found"})
		return
	}

	var labs []labSummary
	if err := h.db.Table("labs").
		Select("id, courseId, title, description, difficulty, `order`, points, timeLimit, dockerImage, serverId").
		Where("courseId = ?", course.ID).
		Order("`order` asc").
		Find(&labs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Load labs failed"})
		return
	}

	isEnrolled := false
	progress := 0
	if hasUser {
		// 使用 Limit(1).Find 而不是 Take，以避免当用户未报名时 GORM 抛出 "record not found" 警告日志
		var tempRows []struct {
			Progress int `gorm:"column:progress"`
		}
		h.db.Table("enrollments").
			Select("progress").
			Where("userId = ? AND courseId = ?", uid, course.ID).
			Limit(1).
			Find(&tempRows)

		if len(tempRows) > 0 {
			isEnrolled = true
			progress = tempRows[0].Progress
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"id":          course.ID,
		"title":       course.Title,
		"description": course.Description,
		"cover":       course.Cover,
		"difficulty":  course.Difficulty,
		"duration":    course.Duration,
		"isPublished": course.IsPublished,
		"createdAt":   course.CreatedAt,
		"updatedAt":   course.UpdatedAt,
		"labs":        labs,
		"isEnrolled":  isEnrolled,
		"progress":    progress,
	})
}

func (h *Handler) EnrollCourse(c *gin.Context) {
	courseID := c.Param("id")
	uid, _ := userIDFromCtx(c)

	var course struct {
		ID string `gorm:"column:id"`
	}
	if err := h.db.Table("courses").Select("id").Where("id = ?", courseID).Take(&course).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Course not found"})
		return
	}

	var e model.Enrollment
	err := h.db.Where("userId = ? AND courseId = ?", uid, courseID).First(&e).Error
	if err == nil {
		c.JSON(http.StatusOK, e)
		return
	}

	e = model.Enrollment{
		ID:       newID(),
		UserID:   uid,
		CourseID: courseID,
		Progress: 0,
	}
	if err := h.db.Create(&e).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Enroll failed"})
		return
	}

	c.JSON(http.StatusOK, e)
}

func (h *Handler) GetCourseProgress(c *gin.Context) {
	courseID := c.Param("id")
	uid, _ := userIDFromCtx(c)

	var e model.Enrollment
	if err := h.db.Where("userId = ? AND courseId = ?", uid, courseID).First(&e).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"progress": 0})
		return
	}

	c.JSON(http.StatusOK, e)
}

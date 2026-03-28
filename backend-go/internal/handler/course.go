package handler

import (
	"net/http"

	"bigdata_zhoc/backend-go/internal/model"

	"github.com/gin-gonic/gin"
)

type courseResp struct {
	model.Course
	LabCount   int  `json:"labCount"`
	IsEnrolled bool `json:"isEnrolled"`
}

func (h *Handler) GetCourses(c *gin.Context) {
	uid, hasUser := userIDFromCtx(c)
	role := userRoleFromCtx(c)

	var courses []model.Course
	q := h.db.Order("createdAt desc")
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
		h.db.Model(&model.Lab{}).Where("courseId = ?", course.ID).Count(&labCount)

		isEnrolled := false
		if hasUser {
			var count int64
			h.db.Model(&model.Enrollment{}).Where("userId = ? AND courseId = ?", uid, course.ID).Count(&count)
			isEnrolled = count > 0
		}

		res = append(res, courseResp{
			Course:      course,
			LabCount:    int(labCount),
			IsEnrolled:  isEnrolled,
		})
	}

	c.JSON(http.StatusOK, res)
}

func (h *Handler) GetCourse(c *gin.Context) {
	id := c.Param("id")
	uid, hasUser := userIDFromCtx(c)

	var course model.Course
	if err := h.db.Where("id = ?", id).First(&course).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Course not found"})
		return
	}

	var labs []model.Lab
	h.db.Where("courseId = ?", course.ID).Order("`order` asc").Find(&labs)

	isEnrolled := false
	progress := 0
	if hasUser {
		var e model.Enrollment
		if err := h.db.Where("userId = ? AND courseId = ?", uid, course.ID).First(&e).Error; err == nil {
			isEnrolled = true
			progress = e.Progress
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

	var course model.Course
	if err := h.db.Where("id = ?", courseID).First(&course).Error; err != nil {
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

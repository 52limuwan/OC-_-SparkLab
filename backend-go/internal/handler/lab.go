package handler

import (
	"net/http"

	"bigdata_zhoc/backend-go/internal/model"

	"github.com/gin-gonic/gin"
)

func (h *Handler) GetLab(c *gin.Context) {
	id := c.Param("id")
	uid, hasUser := userIDFromCtx(c)

	var lab model.Lab
	if err := h.db.Where("id = ?", id).First(&lab).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Lab not found"})
		return
	}

	var course model.Course
	h.db.Where("id = ?", lab.CourseID).Limit(1).Find(&course)

	var steps []model.Step
	h.db.Where("labId = ?", lab.ID).Order("`order` asc").Find(&steps)

	var lastSubmission *model.Submission
	if hasUser {
		var s model.Submission
		if err := h.db.Where("userId = ? AND labId = ?", uid, lab.ID).
			Order("submittedAt desc").Limit(1).Find(&s).Error; err == nil && s.ID != "" {
			lastSubmission = &s
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"id":             lab.ID,
		"courseId":       lab.CourseID,
		"title":          lab.Title,
		"description":    lab.Description,
		"content":        lab.Content,
		"difficulty":     lab.Difficulty,
		"order":          lab.Order,
		"points":         lab.Points,
		"timeLimit":      lab.TimeLimit,
		"dockerImage":    lab.DockerImage,
		"shellCommand":   lab.ShellCmd,
		"judgeType":      lab.JudgeType,
		"judgeScript":    lab.JudgeScript,
		"course":         gin.H{"id": course.ID, "title": course.Title},
		"steps":          steps,
		"lastSubmission": lastSubmission,
	})
}

func (h *Handler) GetLabsByCourse(c *gin.Context) {
	courseID := c.Param("courseId")
	var labs []model.Lab
	if err := h.db.Where("courseId = ?", courseID).Order("`order` asc").Find(&labs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Load labs failed"})
		return
	}

	resp := make([]gin.H, 0, len(labs))
	for _, lab := range labs {
		var steps []model.Step
		h.db.Where("labId = ?", lab.ID).Select("id,title,`order`").Order("`order` asc").Find(&steps)
		resp = append(resp, gin.H{
			"id":          lab.ID,
			"courseId":    lab.CourseID,
			"title":       lab.Title,
			"description": lab.Description,
			"content":     lab.Content,
			"difficulty":  lab.Difficulty,
			"order":       lab.Order,
			"points":      lab.Points,
			"timeLimit":   lab.TimeLimit,
			"steps":       steps,
		})
	}

	c.JSON(http.StatusOK, resp)
}

func (h *Handler) SubmitLab(c *gin.Context) {
	labID := c.Param("id")
	uid, _ := userIDFromCtx(c)

	var lab model.Lab
	if err := h.db.Where("id = ?", labID).First(&lab).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Lab not found"})
		return
	}

	s := model.Submission{
		ID:          newID(),
		UserID:      uid,
		LabID:       labID,
		Status:      "pending",
		MaxScore:    lab.Points,
		Score:       0,
		SubmittedAt: model.Now(),
	}
	if err := h.db.Create(&s).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Submit failed"})
		return
	}

	var containers []model.Container
	h.db.Where("userId = ? AND labId = ? AND status IN ?", uid, labID, []string{"running", "stopped"}).Find(&containers)
	for _, ct := range containers {
		_ = h.db.Delete(&model.Container{}, "id = ?", ct.ID).Error
	}

	c.JSON(http.StatusOK, s)
}

package handler

import (
	"encoding/json"
	"math/rand"
	"net/http"
	"strings"
	"time"

	"bigdata_zhoc/backend-go/internal/model"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type adminUserPayload struct {
	Username    string  `json:"username"`
	DisplayName string  `json:"displayName"`
	Password    *string `json:"password"`
	Role        *string `json:"role"`
	QQNumber    *string `json:"qqNumber"`
}

type adminCoursePayload struct {
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Cover       *string `json:"cover"`
	Difficulty  string  `json:"difficulty"`
	Duration    int     `json:"duration"`
	IsPublished *bool   `json:"isPublished"`
}

type adminLabPayload struct {
	CourseID        string   `json:"courseId"`
	Title           string   `json:"title"`
	Description     string   `json:"description"`
	Content         string   `json:"content"`
	Difficulty      string   `json:"difficulty"`
	Order           int      `json:"order"`
	Points          int      `json:"points"`
	TimeLimit       int      `json:"timeLimit"`
	ServerID        *string  `json:"serverId"`
	DockerImage     string   `json:"dockerImage"`
	CPULimit        float64  `json:"cpuLimit"`
	MemoryLimit     int      `json:"memoryLimit"`
	ShellCommand    *string  `json:"shellCommand"`
	RestartPolicy   *string  `json:"restartPolicy"`
	PortMappings    any      `json:"portMappings"`
	EnvironmentVars any      `json:"environmentVars"`
	VolumeMounts    any      `json:"volumeMounts"`
	JudgeType       *string  `json:"judgeType"`
	JudgeScript     *string  `json:"judgeScript"`
}

func (h *Handler) RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		if userRoleFromCtx(c) != "ADMIN" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "Forbidden"})
			return
		}
		c.Next()
	}
}

func (h *Handler) AdminGetUsers(c *gin.Context) {
	type row struct {
		model.User
		ContainerCount  int64 `gorm:"column:containerCount"`
		SubmissionCount int64 `gorm:"column:submissionCount"`
	}

	var rows []row
	err := h.db.Table("users u").
		Select("u.*, (SELECT COUNT(1) FROM containers c WHERE c.userId = u.id) as containerCount, (SELECT COUNT(1) FROM submissions s WHERE s.userId = u.id) as submissionCount").
		Order("u.createdAt desc").
		Find(&rows).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Load users failed"})
		return
	}

	resp := make([]gin.H, 0, len(rows))
	for _, u := range rows {
		resp = append(resp, gin.H{
			"id":           u.ID,
			"username":     u.Username,
			"displayName":  u.DisplayName,
			"role":         u.Role,
			"qqNumber":     u.QQNumber,
			"createdAt":    u.CreatedAt,
			"lastActiveAt": u.LastActiveAt,
			"_count": gin.H{
				"containers":  u.ContainerCount,
				"submissions": u.SubmissionCount,
			},
		})
	}

	c.JSON(http.StatusOK, resp)
}

func (h *Handler) AdminCreateUser(c *gin.Context) {
	var req adminUserPayload
	if err := c.ShouldBindJSON(&req); err != nil || req.Username == "" || req.DisplayName == "" || req.Password == nil || *req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid payload"})
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(*req.Password), 10)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Hash password failed"})
		return
	}

	role := "STUDENT"
	if req.Role != nil && strings.TrimSpace(*req.Role) != "" {
		role = *req.Role
	}

	u := model.User{
		ID:           newID(),
		Username:     req.Username,
		DisplayName:  req.DisplayName,
		Email:        req.Username + "@sparklab.local",
		Password:     string(hashed),
		Role:         role,
		QQNumber:     req.QQNumber,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
		LastActiveAt: time.Now(),
	}
	if err := h.db.Create(&u).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"message": "Username or QQ number already exists"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":          u.ID,
		"username":    u.Username,
		"displayName": u.DisplayName,
		"role":        u.Role,
		"qqNumber":    u.QQNumber,
		"createdAt":   u.CreatedAt,
	})
}

func (h *Handler) AdminUpdateUser(c *gin.Context) {
	id := c.Param("id")
	var req adminUserPayload
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid payload"})
		return
	}

	updates := map[string]any{"updatedAt": time.Now()}
	if req.Username != "" {
		updates["username"] = req.Username
		updates["email"] = req.Username + "@sparklab.local"
	}
	if req.DisplayName != "" {
		updates["displayName"] = req.DisplayName
	}
	if req.Role != nil && *req.Role != "" {
		updates["role"] = *req.Role
	}
	if req.QQNumber != nil {
		updates["qqNumber"] = req.QQNumber
	}
	if req.Password != nil && *req.Password != "" {
		hashed, err := bcrypt.GenerateFromPassword([]byte(*req.Password), 10)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Hash password failed"})
			return
		}
		updates["password"] = string(hashed)
	}

	if err := h.db.Model(&model.User{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"message": "Update user failed"})
		return
	}

	var u model.User
	if err := h.db.Where("id = ?", id).First(&u).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":          u.ID,
		"username":    u.Username,
		"displayName": u.DisplayName,
		"role":        u.Role,
		"qqNumber":    u.QQNumber,
		"createdAt":   u.CreatedAt,
	})
}

func (h *Handler) AdminDeleteUser(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Delete(&model.User{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Delete user failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

func (h *Handler) AdminCreateCourse(c *gin.Context) {
	var req adminCoursePayload
	if err := c.ShouldBindJSON(&req); err != nil || req.Title == "" || req.Description == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid payload"})
		return
	}
	isPublished := false
	if req.IsPublished != nil {
		isPublished = *req.IsPublished
	}
	if req.Difficulty == "" {
		req.Difficulty = "beginner"
	}

	course := model.Course{
		ID:          newID(),
		Title:       req.Title,
		Description: req.Description,
		Cover:       req.Cover,
		Difficulty:  req.Difficulty,
		Duration:    req.Duration,
		IsPublished: isPublished,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	if err := h.db.Create(&course).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Create course failed"})
		return
	}
	c.JSON(http.StatusOK, course)
}

func (h *Handler) AdminUpdateCourse(c *gin.Context) {
	id := c.Param("id")
	var req adminCoursePayload
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid payload"})
		return
	}

	updates := map[string]any{"updatedAt": time.Now()}
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.Cover != nil {
		updates["cover"] = req.Cover
	}
	if req.Difficulty != "" {
		updates["difficulty"] = req.Difficulty
	}
	if req.Duration > 0 {
		updates["duration"] = req.Duration
	}
	if req.IsPublished != nil {
		updates["isPublished"] = *req.IsPublished
	}

	if err := h.db.Model(&model.Course{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Update course failed"})
		return
	}

	var course model.Course
	h.db.Where("id = ?", id).First(&course)
	c.JSON(http.StatusOK, course)
}

func (h *Handler) AdminDeleteCourse(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Delete(&model.Course{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Delete course failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Course deleted successfully"})
}

func toJSONStringPtr(v any) *string {
	if v == nil {
		return nil
	}
	b, err := json.Marshal(v)
	if err != nil || string(b) == "null" {
		return nil
	}
	if string(b) == "[]" {
		return nil
	}
	s := string(b)
	return &s
}

func (h *Handler) AdminCreateLab(c *gin.Context) {
	var req adminLabPayload
	if err := c.ShouldBindJSON(&req); err != nil || req.CourseID == "" || req.Title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid payload"})
		return
	}

	difficulty := req.Difficulty
	if difficulty == "" {
		difficulty = "beginner"
	}
	timeLimit := req.TimeLimit
	if timeLimit <= 0 {
		timeLimit = 60
	}
	points := req.Points
	if points <= 0 {
		points = 100
	}
	order := req.Order
	if order <= 0 {
		order = 1
	}
	dockerImage := req.DockerImage
	if dockerImage == "" {
		dockerImage = "ubuntu:22.04"
	}
	cpuLimit := req.CPULimit
	if cpuLimit <= 0 {
		cpuLimit = 1.0
	}
	memoryLimit := req.MemoryLimit
	if memoryLimit <= 0 {
		memoryLimit = 512
	}
	shellCommand := "/bin/bash"
	if req.ShellCommand != nil && *req.ShellCommand != "" {
		shellCommand = *req.ShellCommand
	}
	restartPolicy := "unless-stopped"
	if req.RestartPolicy != nil && *req.RestartPolicy != "" {
		restartPolicy = *req.RestartPolicy
	}
	judgeType := "manual"
	if req.JudgeType != nil && *req.JudgeType != "" {
		judgeType = *req.JudgeType
	}

	lab := model.Lab{
		ID:              newID(),
		CourseID:        req.CourseID,
		Title:           req.Title,
		Description:     req.Description,
		Content:         req.Content,
		Difficulty:      difficulty,
		Order:           order,
		Points:          points,
		TimeLimit:       timeLimit,
		ServerID:        req.ServerID,
		DockerImage:     dockerImage,
		CPULimit:        cpuLimit,
		MemoryLimit:     memoryLimit,
		ShellCmd:        shellCommand,
		PortMappings:    toJSONStringPtr(req.PortMappings),
		EnvironmentVars: toJSONStringPtr(req.EnvironmentVars),
		VolumeMounts:    toJSONStringPtr(req.VolumeMounts),
		RestartPolicy:   restartPolicy,
		JudgeType:       judgeType,
		JudgeScript:     req.JudgeScript,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	if err := h.db.Create(&lab).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Create lab failed"})
		return
	}

	c.JSON(http.StatusOK, lab)
}

func (h *Handler) AdminUpdateLab(c *gin.Context) {
	id := c.Param("id")
	var req adminLabPayload
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid payload"})
		return
	}

	updates := map[string]any{"updatedAt": time.Now()}
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	updates["content"] = req.Content
	if req.Difficulty != "" {
		updates["difficulty"] = req.Difficulty
	}
	if req.Order > 0 {
		updates["order"] = req.Order
	}
	if req.Points > 0 {
		updates["points"] = req.Points
	}
	if req.TimeLimit > 0 {
		updates["timeLimit"] = req.TimeLimit
	}
	updates["serverId"] = req.ServerID
	if req.DockerImage != "" {
		updates["dockerImage"] = req.DockerImage
	}
	if req.CPULimit > 0 {
		updates["cpuLimit"] = req.CPULimit
	}
	if req.MemoryLimit > 0 {
		updates["memoryLimit"] = req.MemoryLimit
	}
	if req.ShellCommand != nil {
		updates["shellCommand"] = *req.ShellCommand
	}
	if req.RestartPolicy != nil {
		updates["restartPolicy"] = *req.RestartPolicy
	}
	if req.PortMappings != nil {
		updates["portMappings"] = toJSONStringPtr(req.PortMappings)
	}
	if req.EnvironmentVars != nil {
		updates["environmentVars"] = toJSONStringPtr(req.EnvironmentVars)
	}
	if req.VolumeMounts != nil {
		updates["volumeMounts"] = toJSONStringPtr(req.VolumeMounts)
	}
	if req.JudgeType != nil {
		updates["judgeType"] = *req.JudgeType
	}
	if req.JudgeScript != nil {
		updates["judgeScript"] = req.JudgeScript
	}

	if err := h.db.Model(&model.Lab{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Update lab failed"})
		return
	}

	var lab model.Lab
	h.db.Where("id = ?", id).First(&lab)
	c.JSON(http.StatusOK, lab)
}

func (h *Handler) AdminDeleteLab(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Delete(&model.Lab{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Delete lab failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Lab deleted successfully"})
}

func (h *Handler) AdminGetContainers(c *gin.Context) {
	type row struct {
		model.Container
		Username    *string `gorm:"column:username"`
		DisplayName *string `gorm:"column:displayName"`
		LabTitle    *string `gorm:"column:labTitle"`
	}

	var rows []row
	err := h.db.Table("containers c").
		Select("c.*, u.username as username, u.displayName as displayName, l.title as labTitle").
		Joins("LEFT JOIN users u ON u.id = c.userId").
		Joins("LEFT JOIN labs l ON l.id = c.labId").
		Order("c.createdAt desc").
		Find(&rows).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Load containers failed"})
		return
	}

	resp := make([]gin.H, 0, len(rows))
	for _, r := range rows {
		resp = append(resp, gin.H{
			"id":          r.ID,
			"userId":      r.UserID,
			"labId":       r.LabID,
			"serverId":    r.ServerID,
			"containerId": r.ContainerID,
			"status":      r.Status,
			"createdAt":   r.CreatedAt,
			"user": gin.H{
				"username":    r.Username,
				"displayName": r.DisplayName,
			},
			"lab": gin.H{
				"title": r.LabTitle,
			},
		})
	}

	c.JSON(http.StatusOK, resp)
}

func (h *Handler) AdminForceStopContainer(c *gin.Context) {
	id := c.Param("id")
	now := time.Now()
	if err := h.db.Model(&model.Container{}).Where("id = ?", id).Updates(map[string]any{
		"status":    "stopped",
		"stoppedAt": now,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Force stop failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Container force stopped"})
}

func (h *Handler) AdminStats(c *gin.Context) {
	var totalUsers, totalCourses, totalLabs, activeContainers, totalSubmissions, totalContainers int64
	h.db.Model(&model.User{}).Count(&totalUsers)
	h.db.Model(&model.Course{}).Count(&totalCourses)
	h.db.Model(&model.Lab{}).Count(&totalLabs)
	h.db.Model(&model.Container{}).Where("status = ?", "running").Count(&activeContainers)
	h.db.Model(&model.Container{}).Count(&totalContainers)
	h.db.Model(&model.Submission{}).Count(&totalSubmissions)

	type statusRow struct {
		Status string `gorm:"column:status" json:"status"`
		Count  int64  `gorm:"column:count" json:"_count"`
	}
	var statusRows []statusRow
	h.db.Table("containers").Select("status, count(1) as count").Group("status").Find(&statusRows)

	type userRow struct {
		ID           string     `gorm:"column:id"`
		Username     string     `gorm:"column:username"`
		DisplayName  string     `gorm:"column:displayName"`
		QQNumber     *string    `gorm:"column:qqNumber"`
		Role         string     `gorm:"column:role"`
		LastActiveAt *time.Time `gorm:"column:lastActiveAt"`
	}
	var recentUsers []userRow
	h.db.Table("users").Where("role <> ?", "ADMIN").Order("lastActiveAt desc").Limit(5).Find(&recentUsers)

	usersResp := make([]gin.H, 0, len(recentUsers))
	for _, u := range recentUsers {
		var cc, sc int64
		h.db.Model(&model.Container{}).Where("userId = ?", u.ID).Count(&cc)
		h.db.Model(&model.Submission{}).Where("userId = ?", u.ID).Count(&sc)
		usersResp = append(usersResp, gin.H{
			"id":           u.ID,
			"username":     u.Username,
			"displayName":  u.DisplayName,
			"qqNumber":     u.QQNumber,
			"role":         u.Role,
			"lastActiveAt": u.LastActiveAt,
			"_count": gin.H{
				"containers":  cc,
				"submissions": sc,
			},
		})
	}

	type containerRow struct {
		ID         string     `gorm:"column:id"`
		Status     string     `gorm:"column:status"`
		CreatedAt  time.Time  `gorm:"column:createdAt"`
		Username   *string    `gorm:"column:username"`
		Display    *string    `gorm:"column:displayName"`
		LabTitle   *string    `gorm:"column:labTitle"`
		StoppedAt  *time.Time `gorm:"column:stoppedAt"`
		StartedAt  *time.Time `gorm:"column:startedAt"`
		ServerID   *string    `gorm:"column:serverId"`
		ContainerID string    `gorm:"column:containerId"`
	}
	var recentContainers []containerRow
	h.db.Table("containers c").
		Select("c.id, c.status, c.createdAt, c.stoppedAt, c.startedAt, c.serverId, c.containerId, u.username as username, u.displayName as displayName, l.title as labTitle").
		Joins("LEFT JOIN users u ON u.id = c.userId").
		Joins("LEFT JOIN labs l ON l.id = c.labId").
		Order("c.createdAt desc").
		Limit(5).
		Find(&recentContainers)

	containersResp := make([]gin.H, 0, len(recentContainers))
	for _, rc := range recentContainers {
		containersResp = append(containersResp, gin.H{
			"id":        rc.ID,
			"status":    rc.Status,
			"createdAt": rc.CreatedAt,
			"user": gin.H{
				"username":    rc.Username,
				"displayName": rc.Display,
			},
			"lab": gin.H{
				"title": rc.LabTitle,
			},
		})
	}

	type courseRow struct {
		ID    string `gorm:"column:id"`
		Title string `gorm:"column:title"`
	}
	var topCourses []courseRow
	h.db.Table("courses").Order("createdAt desc").Limit(5).Find(&topCourses)

	courseResp := make([]gin.H, 0, len(topCourses))
	for _, cc := range topCourses {
		var ec, lc int64
		h.db.Model(&model.Enrollment{}).Where("courseId = ?", cc.ID).Count(&ec)
		h.db.Model(&model.Lab{}).Where("courseId = ?", cc.ID).Count(&lc)
		courseResp = append(courseResp, gin.H{
			"id":    cc.ID,
			"title": cc.Title,
			"_count": gin.H{
				"enrollments": ec,
				"labs":        lc,
			},
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"totalUsers":        totalUsers,
		"totalCourses":      totalCourses,
		"totalLabs":         totalLabs,
		"activeContainers":  activeContainers,
		"totalContainers":   totalContainers,
		"totalSubmissions":  totalSubmissions,
		"recentUsers":       usersResp,
		"recentContainers":  containersResp,
		"courseStats":       courseResp,
		"containersByStatus": statusRows,
	})
}

func (h *Handler) AdminGetAvailablePort(c *gin.Context) {
	serverID := c.Param("serverId")

	var containers []model.Container
	h.db.Where("serverId = ?", serverID).Find(&containers)

	used := map[int]bool{}
	for _, ct := range containers {
		if ct.PortMappings == nil {
			continue
		}
		var arr []map[string]any
		if err := json.Unmarshal([]byte(*ct.PortMappings), &arr); err != nil {
			continue
		}
		for _, p := range arr {
			if hp, ok := p["hostPort"].(float64); ok {
				used[int(hp)] = true
			}
		}
	}

	cand := make([]int, 0, 512)
	for p := 10000; p <= 50000; p++ {
		if !used[p] {
			cand = append(cand, p)
		}
	}
	if len(cand) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "No available ports in range"})
		return
	}

	rand.Seed(time.Now().UnixNano())
	c.JSON(http.StatusOK, gin.H{"port": cand[rand.Intn(len(cand))]})
}

package handler

import (
	"net/http"
	"os"
	"strconv"
	"time"

	"bigdata_zhoc/backend-go/internal/model"

	"github.com/gin-gonic/gin"
)

func envInt(key string, fallback int) int {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return fallback
	}
	return n
}

func autoStopTimeout() time.Duration {
	ms := envInt("AUTO_STOP_TIMEOUT", 1800000)
	if ms <= 0 {
		ms = 1800000
	}
	return time.Duration(ms) * time.Millisecond
}

type createContainerReq struct {
	LabID string `json:"labId"`
}

type execCommandReq struct {
	Command string `json:"command"`
}

type execCreateReq struct {
	Command string         `json:"command"`
	Options map[string]any `json:"options"`
}

type execStartReq struct {
	ExecID  string         `json:"execId"`
	Options map[string]any `json:"options"`
}

func (h *Handler) CreateContainer(c *gin.Context) {
	uid, _ := userIDFromCtx(c)

	var activeCount int64
	h.db.Model(&model.Container{}).
		Where("userId = ? AND status IN ?", uid, []string{"creating", "running"}).
		Count(&activeCount)

	maxContainers := envInt("MAX_CONTAINERS_PER_USER", 3)
	if int(activeCount) >= maxContainers {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Maximum containers per user exceeded"})
		return
	}

	var req createContainerReq
	if err := c.ShouldBindJSON(&req); err != nil || req.LabID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "labId is required"})
		return
	}

	var lab model.Lab
	if err := h.db.Where("id = ?", req.LabID).First(&lab).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Lab not found"})
		return
	}

	now := time.Now()
	autoStopAt := now.Add(autoStopTimeout())
	container := model.Container{
		ID:           newID(),
		UserID:       uid,
		LabID:        req.LabID,
		ServerID:     lab.ServerID,
		ContainerID:  "sim-" + newID()[:12],
		Status:       "running",
		PortMappings: lab.PortMappings,
		CPULimit:     lab.CPULimit,
		MemoryLimit:  lab.MemoryLimit,
		CreatedAt:    now,
		StartedAt:    &now,
		LastActiveAt: now,
		AutoStopAt:   &autoStopAt,
	}

	if err := h.db.Create(&container).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Create container failed"})
		return
	}

	c.JSON(http.StatusCreated, container)
}

func (h *Handler) GetContainers(c *gin.Context) {
	uid, _ := userIDFromCtx(c)
	role := userRoleFromCtx(c)

	type row struct {
		ID           string  `gorm:"column:id"`
		UserID       string  `gorm:"column:userId"`
		LabID        string  `gorm:"column:labId"`
		ServerID     string  `gorm:"column:serverId"`
		ContainerID  string  `gorm:"column:containerId"`
		Status       string  `gorm:"column:status"`
		PortMappings string  `gorm:"column:portMappings"`
		CPULimit     float64 `gorm:"column:cpuLimit"`
		MemoryLimit  int64   `gorm:"column:memoryLimit"`
		CreatedAt    int64   `gorm:"column:createdAt"`
		StartedAt    *int64  `gorm:"column:startedAt"`
		StoppedAt    *int64  `gorm:"column:stoppedAt"`
		LastActiveAt int64   `gorm:"column:lastActiveAt"`
		AutoStopAt   *int64  `gorm:"column:autoStopAt"`
		LabTitle     *string `gorm:"column:labTitle"`
	}

	q := h.db.Table("containers c").
		Select("c.id, c.userId, c.labId, c.serverId, c.containerId, c.status, c.portMappings, c.cpuLimit, c.memoryLimit, cast(c.createdAt as integer) as createdAt, cast(c.startedAt as integer) as startedAt, cast(c.stoppedAt as integer) as stoppedAt, cast(c.lastActiveAt as integer) as lastActiveAt, cast(c.autoStopAt as integer) as autoStopAt, l.title as labTitle").
		Joins("LEFT JOIN labs l ON l.id = c.labId").
		Order("c.createdAt desc")
	if role != "ADMIN" {
		q = q.Where("c.userId = ?", uid)
	}

	var rows []row
	if err := q.Find(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Load containers failed"})
		return
	}

	resp := make([]gin.H, 0, len(rows))
	for _, r := range rows {
		resp = append(resp, gin.H{
			"id":           r.ID,
			"userId":       r.UserID,
			"labId":        r.LabID,
			"serverId":     r.ServerID,
			"containerId":  r.ContainerID,
			"status":       r.Status,
			"portMappings": r.PortMappings,
			"cpuLimit":     r.CPULimit,
			"memoryLimit":  r.MemoryLimit,
			"createdAt":    r.CreatedAt,
			"startedAt":    r.StartedAt,
			"stoppedAt":    r.StoppedAt,
			"lastActiveAt": r.LastActiveAt,
			"autoStopAt":   r.AutoStopAt,
			"lab": gin.H{
				"id":    r.LabID,
				"title": r.LabTitle,
			},
		})
	}

	c.JSON(http.StatusOK, resp)
}

func (h *Handler) getOwnedContainer(c *gin.Context, id string) (*model.Container, bool) {
	uid, _ := userIDFromCtx(c)
	role := userRoleFromCtx(c)

	var container model.Container
	// Using Table for manual scan to avoid type issues with SQLite dates
	err := h.db.Table("containers").
		Select("*, cast(createdAt as integer) as createdAt, cast(updatedAt as integer) as updatedAt, cast(startedAt as integer) as startedAt, cast(stoppedAt as integer) as stoppedAt, cast(lastActiveAt as integer) as lastActiveAt, cast(autoStopAt as integer) as autoStopAt").
		Where("id = ?", id).
		First(&container).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Container not found"})
		return nil, false
	}

	if role != "ADMIN" && container.UserID != uid {
		c.JSON(http.StatusForbidden, gin.H{"message": "Access denied"})
		return nil, false
	}

	return &container, true
}

func (h *Handler) GetContainer(c *gin.Context) {
	container, ok := h.getOwnedContainer(c, c.Param("id"))
	if !ok {
		return
	}
	c.JSON(http.StatusOK, container)
}

func (h *Handler) StartContainer(c *gin.Context) {
	container, ok := h.getOwnedContainer(c, c.Param("id"))
	if !ok {
		return
	}

	now := time.Now()
	updates := map[string]any{
		"status":       "running",
		"startedAt":    now,
		"lastActiveAt": now,
		"autoStopAt":   now.Add(autoStopTimeout()),
		"stoppedAt":    nil,
	}
	if err := h.db.Table("containers").Where("id = ?", container.ID).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Start container failed"})
		return
	}

	h.db.Table("containers").
		Select("*, cast(createdAt as integer) as createdAt, cast(updatedAt as integer) as updatedAt, cast(startedAt as integer) as startedAt, cast(stoppedAt as integer) as stoppedAt, cast(lastActiveAt as integer) as lastActiveAt, cast(autoStopAt as integer) as autoStopAt").
		Where("id = ?", container.ID).
		First(&container)
	c.JSON(http.StatusOK, container)
}

func (h *Handler) StopContainer(c *gin.Context) {
	container, ok := h.getOwnedContainer(c, c.Param("id"))
	if !ok {
		return
	}

	now := time.Now()
	updates := map[string]any{
		"status":    "stopped",
		"stoppedAt": now,
	}
	if err := h.db.Table("containers").Where("id = ?", container.ID).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Stop container failed"})
		return
	}

	h.db.Table("containers").
		Select("*, cast(createdAt as integer) as createdAt, cast(updatedAt as integer) as updatedAt, cast(startedAt as integer) as startedAt, cast(stoppedAt as integer) as stoppedAt, cast(lastActiveAt as integer) as lastActiveAt, cast(autoStopAt as integer) as autoStopAt").
		Where("id = ?", container.ID).
		First(&container)
	c.JSON(http.StatusOK, container)
}

func (h *Handler) RemoveContainer(c *gin.Context) {
	container, ok := h.getOwnedContainer(c, c.Param("id"))
	if !ok {
		return
	}

	if err := h.db.Delete(&model.Container{}, "id = ?", container.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Remove container failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Container removed successfully"})
}

func (h *Handler) ContainerHeartbeat(c *gin.Context) {
	container, ok := h.getOwnedContainer(c, c.Param("id"))
	if !ok {
		return
	}

	now := time.Now()
	if err := h.db.Table("containers").Where("id = ?", container.ID).Updates(map[string]any{
		"lastActiveAt": now,
		"autoStopAt":   now.Add(autoStopTimeout()),
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Heartbeat failed"})
		return
	}

	h.db.Table("containers").
		Select("*, cast(createdAt as integer) as createdAt, cast(updatedAt as integer) as updatedAt, cast(startedAt as integer) as startedAt, cast(stoppedAt as integer) as stoppedAt, cast(lastActiveAt as integer) as lastActiveAt, cast(autoStopAt as integer) as autoStopAt").
		Where("id = ?", container.ID).
		First(&container)
	c.JSON(http.StatusOK, container)
}

func (h *Handler) ExecContainer(c *gin.Context) {
	container, ok := h.getOwnedContainer(c, c.Param("id"))
	if !ok {
		return
	}
	if container.Status != "running" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Container is not running"})
		return
	}

	var req execCommandReq
	if err := c.ShouldBindJSON(&req); err != nil || req.Command == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "command is required"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"output": "[simulated] " + req.Command})
}

func (h *Handler) ExecCreateContainer(c *gin.Context) {
	container, ok := h.getOwnedContainer(c, c.Param("id"))
	if !ok {
		return
	}
	if container.Status != "running" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Container is not running"})
		return
	}

	var req execCreateReq
	if err := c.ShouldBindJSON(&req); err != nil || req.Command == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "command is required"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"execId": "exec-" + newID()[:12]})
}

func (h *Handler) ExecStartContainer(c *gin.Context) {
	container, ok := h.getOwnedContainer(c, c.Param("id"))
	if !ok {
		return
	}
	if container.Status != "running" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Container is not running"})
		return
	}

	var req execStartReq
	if err := c.ShouldBindJSON(&req); err != nil || req.ExecID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "execId is required"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"output": "[simulated exec output]", "execId": req.ExecID})
}

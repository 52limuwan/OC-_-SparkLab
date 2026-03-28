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

	type containerJoin struct {
		model.Container
		LabTitle *string `gorm:"column:labTitle"`
	}

	q := h.db.Table("containers c").
		Select("c.*, l.title as labTitle").
		Joins("LEFT JOIN labs l ON l.id = c.labId").
		Order("c.createdAt desc")
	if role != "ADMIN" {
		q = q.Where("c.userId = ?", uid)
	}

	var rows []containerJoin
	if err := q.Find(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Load containers failed"})
		return
	}

	resp := make([]gin.H, 0, len(rows))
	for _, row := range rows {
		resp = append(resp, gin.H{
			"id":           row.ID,
			"userId":       row.UserID,
			"labId":        row.LabID,
			"serverId":     row.ServerID,
			"containerId":  row.ContainerID,
			"status":       row.Status,
			"portMappings": row.PortMappings,
			"cpuLimit":     row.CPULimit,
			"memoryLimit":  row.MemoryLimit,
			"createdAt":    row.CreatedAt,
			"startedAt":    row.StartedAt,
			"stoppedAt":    row.StoppedAt,
			"lastActiveAt": row.LastActiveAt,
			"autoStopAt":   row.AutoStopAt,
			"lab": gin.H{
				"id":    row.LabID,
				"title": row.LabTitle,
			},
		})
	}

	c.JSON(http.StatusOK, resp)
}

func (h *Handler) getOwnedContainer(c *gin.Context, id string) (*model.Container, bool) {
	uid, _ := userIDFromCtx(c)
	role := userRoleFromCtx(c)

	var container model.Container
	if err := h.db.Where("id = ?", id).First(&container).Error; err != nil {
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
	if err := h.db.Model(&model.Container{}).Where("id = ?", container.ID).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Start container failed"})
		return
	}

	h.db.Where("id = ?", container.ID).First(&container)
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
	if err := h.db.Model(&model.Container{}).Where("id = ?", container.ID).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Stop container failed"})
		return
	}

	h.db.Where("id = ?", container.ID).First(&container)
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
	if err := h.db.Model(&model.Container{}).Where("id = ?", container.ID).Updates(map[string]any{
		"lastActiveAt": now,
		"autoStopAt":   now.Add(autoStopTimeout()),
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Heartbeat failed"})
		return
	}

	h.db.Where("id = ?", container.ID).First(&container)
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

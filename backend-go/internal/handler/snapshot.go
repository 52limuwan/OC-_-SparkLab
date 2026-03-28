package handler

import (
	"net/http"
	"time"

	"bigdata_zhoc/backend-go/internal/model"

	"github.com/gin-gonic/gin"
)

type createSnapshotReq struct {
	ContainerID string  `json:"containerId"`
	Name        string  `json:"name"`
	Description *string `json:"description"`
}

func (h *Handler) CreateSnapshot(c *gin.Context) {
	uid, _ := userIDFromCtx(c)

	var req createSnapshotReq
	if err := c.ShouldBindJSON(&req); err != nil || req.ContainerID == "" || req.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "containerId and name are required"})
		return
	}

	var container model.Container
	if err := h.db.Where("id = ?", req.ContainerID).First(&container).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Container not found"})
		return
	}
	if container.UserID != uid {
		c.JSON(http.StatusForbidden, gin.H{"message": "Access denied"})
		return
	}

	s := model.Snapshot{
		ID:          newID(),
		UserID:      uid,
		ContainerID: req.ContainerID,
		ImageID:     "snapshot-" + newID()[:12],
		Name:        req.Name,
		Description: req.Description,
		Size:        0,
		CreatedAt:   time.Now(),
	}
	if err := h.db.Create(&s).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Create snapshot failed"})
		return
	}

	c.JSON(http.StatusCreated, s)
}

func (h *Handler) GetSnapshots(c *gin.Context) {
	uid, _ := userIDFromCtx(c)

	type row struct {
		model.Snapshot
		LabID    *string `gorm:"column:labId"`
		LabTitle *string `gorm:"column:labTitle"`
	}

	var rows []row
	err := h.db.Table("snapshots s").
		Select("s.*, c.labId as labId, l.title as labTitle").
		Joins("LEFT JOIN containers c ON c.id = s.containerId").
		Joins("LEFT JOIN labs l ON l.id = c.labId").
		Where("s.userId = ?", uid).
		Order("s.createdAt desc").
		Find(&rows).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Load snapshots failed"})
		return
	}

	resp := make([]gin.H, 0, len(rows))
	for _, r := range rows {
		resp = append(resp, gin.H{
			"id":          r.ID,
			"userId":      r.UserID,
			"containerId": r.ContainerID,
			"imageId":     r.ImageID,
			"name":        r.Name,
			"description": r.Description,
			"size":        r.Size,
			"createdAt":   r.CreatedAt,
			"container": gin.H{
				"id": r.ContainerID,
				"lab": gin.H{
					"id":    r.LabID,
					"title": r.LabTitle,
				},
			},
		})
	}

	c.JSON(http.StatusOK, resp)
}

func (h *Handler) GetSnapshot(c *gin.Context) {
	uid, _ := userIDFromCtx(c)
	id := c.Param("id")

	var s model.Snapshot
	if err := h.db.Where("id = ?", id).First(&s).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Snapshot not found"})
		return
	}
	if s.UserID != uid {
		c.JSON(http.StatusForbidden, gin.H{"message": "Access denied"})
		return
	}

	c.JSON(http.StatusOK, s)
}

func (h *Handler) RestoreSnapshot(c *gin.Context) {
	uid, _ := userIDFromCtx(c)
	id := c.Param("id")

	var s model.Snapshot
	if err := h.db.Where("id = ?", id).First(&s).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Snapshot not found"})
		return
	}
	if s.UserID != uid {
		c.JSON(http.StatusForbidden, gin.H{"message": "Access denied"})
		return
	}

	var src model.Container
	if err := h.db.Where("id = ?", s.ContainerID).First(&src).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Source container not found"})
		return
	}

	now := time.Now()
	nc := model.Container{
		ID:           newID(),
		UserID:       uid,
		LabID:        src.LabID,
		ServerID:     src.ServerID,
		ContainerID:  "restored-" + newID()[:12],
		Status:       "running",
		PortMappings: src.PortMappings,
		CPULimit:     src.CPULimit,
		MemoryLimit:  src.MemoryLimit,
		CreatedAt:    now,
		StartedAt:    &now,
		LastActiveAt: now,
	}
	if err := h.db.Create(&nc).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Restore snapshot failed"})
		return
	}

	c.JSON(http.StatusOK, nc)
}

func (h *Handler) RemoveSnapshot(c *gin.Context) {
	uid, _ := userIDFromCtx(c)
	id := c.Param("id")

	var s model.Snapshot
	if err := h.db.Where("id = ?", id).First(&s).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Snapshot not found"})
		return
	}
	if s.UserID != uid {
		c.JSON(http.StatusForbidden, gin.H{"message": "Access denied"})
		return
	}

	if err := h.db.Delete(&model.Snapshot{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Delete snapshot failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Snapshot removed successfully"})
}

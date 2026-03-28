package handler

import (
	"fmt"
	"net/http"
	"time"

	"bigdata_zhoc/backend-go/internal/model"

	"github.com/gin-gonic/gin"
)

func (h *Handler) findServerForAdmin(id string) (*model.Server, bool) {
	var s model.Server
	if err := h.db.Where("id = ?", id).First(&s).Error; err != nil {
		return nil, false
	}
	return &s, true
}

func (h *Handler) findContainerByServer(serverID, containerID string) (*model.Container, bool) {
	var ct model.Container
	if err := h.db.Where("serverId = ? AND containerId = ?", serverID, containerID).First(&ct).Error; err != nil {
		return nil, false
	}
	return &ct, true
}

type createServerReq struct {
	Name string `json:"name"`
}

type updateServerReq struct {
	Name          *string  `json:"name"`
	Status        *string  `json:"status"`
	MaxContainers *int     `json:"maxContainers"`
	CPUCores      *int     `json:"cpuCores"`
	CPUModel      *string  `json:"cpuModel"`
	TotalMemory   *int     `json:"totalMemory"`
	CPUUsage      *float64 `json:"cpuUsage"`
	MemoryUsage   *float64 `json:"memoryUsage"`
}

type pullImageReq struct {
	ImageName string `json:"imageName"`
	Tag       string `json:"tag"`
}

type buildImageReq struct {
	Dockerfile string `json:"dockerfile"`
	ImageName  string `json:"imageName"`
	Tag        string `json:"tag"`
}

func randomToken32() string {
	id := newID() + newID()
	if len(id) >= 32 {
		return id[:32]
	}
	return fmt.Sprintf("%032s", id)
}

func (h *Handler) CreateServer(c *gin.Context) {
	var req createServerReq
	if err := c.ShouldBindJSON(&req); err != nil || req.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "name is required"})
		return
	}

	token := randomToken32()
	now := time.Now()
	server := model.Server{
		ID:               newID(),
		Name:             req.Name,
		Host:             "",
		Port:             0,
		Username:         "",
		AuthType:         "password",
		Password:         &token,
		Status:           "offline",
		LastCheckAt:      now,
		MaxContainers:    10,
		CPUCores:         0,
		TotalMemory:      0,
		ActiveContainers: 0,
		CPUUsage:         0,
		MemoryUsage:      0,
		CreatedAt:        now,
		UpdatedAt:        now,
	}

	if err := h.db.Create(&server).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Create server failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":               server.ID,
		"name":             server.Name,
		"host":             server.Host,
		"port":             server.Port,
		"username":         server.Username,
		"authType":         server.AuthType,
		"status":           server.Status,
		"lastCheckAt":      server.LastCheckAt,
		"maxContainers":    server.MaxContainers,
		"cpuCores":         server.CPUCores,
		"cpuModel":         server.CPUModel,
		"totalMemory":      server.TotalMemory,
		"activeContainers": server.ActiveContainers,
		"cpuUsage":         server.CPUUsage,
		"memoryUsage":      server.MemoryUsage,
		"createdAt":        server.CreatedAt,
		"updatedAt":        server.UpdatedAt,
		"agentToken":       token,
	})
}

func (h *Handler) GetServers(c *gin.Context) {
	type row struct {
		model.Server
		ContainerCount int64 `gorm:"column:containerCount"`
	}

	var rows []row
	err := h.db.Table("servers s").
		Select("s.*, (SELECT COUNT(1) FROM containers c WHERE c.serverId = s.id) as containerCount").
		Order("s.createdAt desc").
		Find(&rows).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Load servers failed"})
		return
	}

	resp := make([]gin.H, 0, len(rows))
	for _, s := range rows {
		resp = append(resp, gin.H{
			"id":               s.ID,
			"name":             s.Name,
			"host":             s.Host,
			"port":             s.Port,
			"username":         s.Username,
			"authType":         s.AuthType,
			"status":           s.Status,
			"lastCheckAt":      s.LastCheckAt,
			"maxContainers":    s.MaxContainers,
			"cpuCores":         s.CPUCores,
			"cpuModel":         s.CPUModel,
			"totalMemory":      s.TotalMemory,
			"activeContainers": s.ActiveContainers,
			"cpuUsage":         s.CPUUsage,
			"memoryUsage":      s.MemoryUsage,
			"createdAt":        s.CreatedAt,
			"updatedAt":        s.UpdatedAt,
			"_count": gin.H{
				"containers": s.ContainerCount,
			},
		})
	}

	c.JSON(http.StatusOK, resp)
}

func (h *Handler) GetServer(c *gin.Context) {
	id := c.Param("id")
	var s model.Server
	if err := h.db.Where("id = ?", id).First(&s).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Server not found"})
		return
	}
	c.JSON(http.StatusOK, s)
}

func (h *Handler) GetServerContainers(c *gin.Context) {
	id := c.Param("id")
	var s model.Server
	if err := h.db.Where("id = ?", id).First(&s).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Server not found"})
		return
	}
	if s.Status != "online" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Server is offline"})
		return
	}

	var containers []model.Container
	h.db.Where("serverId = ?", id).Order("createdAt desc").Find(&containers)

	resp := make([]gin.H, 0, len(containers))
	for _, ct := range containers {
		resp = append(resp, gin.H{
			"id":      ct.ContainerID,
			"name":    ct.ContainerID,
			"image":   "unknown",
			"status":  ct.Status,
			"created": ct.CreatedAt,
			"ports":   []any{},
		})
	}
	c.JSON(http.StatusOK, gin.H{"containers": resp})
}

func (h *Handler) StartServerContainer(c *gin.Context) {
	serverID := c.Param("id")
	containerID := c.Param("containerId")
	if _, ok := h.findServerForAdmin(serverID); !ok {
		c.JSON(http.StatusNotFound, gin.H{"message": "Server not found"})
		return
	}
	if _, ok := h.findContainerByServer(serverID, containerID); !ok {
		c.JSON(http.StatusNotFound, gin.H{"message": "Container not found"})
		return
	}

	now := time.Now()
	if err := h.db.Model(&model.Container{}).Where("serverId = ? AND containerId = ?", serverID, containerID).Updates(map[string]any{
		"status":    "running",
		"startedAt": now,
		"lastActiveAt": now,
		"stoppedAt": nil,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to start container"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Container started successfully"})
}

func (h *Handler) StopServerContainer(c *gin.Context) {
	serverID := c.Param("id")
	containerID := c.Param("containerId")
	if _, ok := h.findServerForAdmin(serverID); !ok {
		c.JSON(http.StatusNotFound, gin.H{"message": "Server not found"})
		return
	}
	if _, ok := h.findContainerByServer(serverID, containerID); !ok {
		c.JSON(http.StatusNotFound, gin.H{"message": "Container not found"})
		return
	}

	now := time.Now()
	if err := h.db.Model(&model.Container{}).Where("serverId = ? AND containerId = ?", serverID, containerID).Updates(map[string]any{
		"status":    "stopped",
		"stoppedAt": now,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to stop container"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Container stopped successfully"})
}

func (h *Handler) RemoveServerContainer(c *gin.Context) {
	serverID := c.Param("id")
	containerID := c.Param("containerId")
	if _, ok := h.findServerForAdmin(serverID); !ok {
		c.JSON(http.StatusNotFound, gin.H{"message": "Server not found"})
		return
	}
	if _, ok := h.findContainerByServer(serverID, containerID); !ok {
		c.JSON(http.StatusNotFound, gin.H{"message": "Container not found"})
		return
	}

	if err := h.db.Delete(&model.Container{}, "serverId = ? AND containerId = ?", serverID, containerID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to remove container"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Container removed successfully"})
}

func (h *Handler) GetServerImages(c *gin.Context) {
	id := c.Param("id")
	var s model.Server
	if err := h.db.Where("id = ?", id).First(&s).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Server not found"})
		return
	}
	if s.Status != "online" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Server is offline"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"images": []any{}})
}

func (h *Handler) PullServerImage(c *gin.Context) {
	var req pullImageReq
	if err := c.ShouldBindJSON(&req); err != nil || req.ImageName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "imageName is required"})
		return
	}
	tag := req.Tag
	if tag == "" {
		tag = "latest"
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "Image pulled successfully",
		"image":   req.ImageName + ":" + tag,
		"logs":    []string{"[simulated] pull started", "[simulated] pull completed"},
	})
}

func (h *Handler) BuildServerImage(c *gin.Context) {
	var req buildImageReq
	if err := c.ShouldBindJSON(&req); err != nil || req.ImageName == "" || req.Dockerfile == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "dockerfile and imageName are required"})
		return
	}
	tag := req.Tag
	if tag == "" {
		tag = "latest"
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "Image built successfully",
		"image":   req.ImageName + ":" + tag,
		"logs":    []string{"[simulated] build started", "[simulated] build completed"},
	})
}

func (h *Handler) RemoveServerImage(c *gin.Context) {
	_ = c.Param("id")
	_ = c.Param("imageId")
	c.JSON(http.StatusOK, gin.H{"message": "Image removed successfully"})
}

func (h *Handler) UpdateServer(c *gin.Context) {
	id := c.Param("id")
	var req updateServerReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid payload"})
		return
	}

	updates := map[string]any{"updatedAt": time.Now()}
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.MaxContainers != nil {
		updates["maxContainers"] = *req.MaxContainers
	}
	if req.CPUCores != nil {
		updates["cpuCores"] = *req.CPUCores
	}
	if req.CPUModel != nil {
		updates["cpuModel"] = *req.CPUModel
	}
	if req.TotalMemory != nil {
		updates["totalMemory"] = *req.TotalMemory
	}
	if req.CPUUsage != nil {
		updates["cpuUsage"] = *req.CPUUsage
	}
	if req.MemoryUsage != nil {
		updates["memoryUsage"] = *req.MemoryUsage
	}

	if err := h.db.Model(&model.Server{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Update server failed"})
		return
	}

	var s model.Server
	h.db.Where("id = ?", id).First(&s)
	c.JSON(http.StatusOK, s)
}

func (h *Handler) DeleteServer(c *gin.Context) {
	id := c.Param("id")
	var active int64
	h.db.Model(&model.Container{}).Where("serverId = ? AND status IN ?", id, []string{"creating", "running"}).Count(&active)
	if active > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"message": fmt.Sprintf("Cannot delete server with %d active containers", active)})
		return
	}

	if err := h.db.Delete(&model.Server{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Delete server failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Server deleted successfully"})
}

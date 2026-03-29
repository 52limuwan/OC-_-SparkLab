package handler

import (
	"archive/tar"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"bigdata_zhoc/backend-go/internal/model"

	"github.com/gin-gonic/gin"
)

type dockerImageSummary struct {
	ID       string   `json:"Id"`
	RepoTags []string `json:"RepoTags"`
	Size     int64    `json:"Size"`
	Created  int64    `json:"Created"`
}

type dockerContainerSummary struct {
	ID      string `json:"Id"`
	Image   string `json:"Image"`
	State   string `json:"State"`
	Created int64  `json:"Created"`
	Names   []string `json:"Names"`
	Ports   []any  `json:"Ports"`
}

func (h *Handler) dockerBaseURL(server *model.Server) (string, error) {
	host := strings.TrimSpace(server.Host)
	if host == "" {
		return "", fmt.Errorf("server host is empty")
	}
	if strings.HasPrefix(host, "http://") || strings.HasPrefix(host, "https://") {
		return fmt.Sprintf("%s:2375", strings.TrimRight(host, "/")), nil
	}
	return fmt.Sprintf("http://%s:2375", host), nil
}

func (h *Handler) dockerRequest(server *model.Server, method, path string, body io.Reader, headers map[string]string) (*http.Response, error) {
	base, err := h.dockerBaseURL(server)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequest(method, base+path, body)
	if err != nil {
		return nil, err
	}
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	client := &http.Client{Timeout: 30 * time.Second}
	return client.Do(req)
}

func readDockerError(resp *http.Response) string {
	b, _ := io.ReadAll(resp.Body)
	if len(b) == 0 {
		return fmt.Sprintf("docker api status %d", resp.StatusCode)
	}
	return strings.TrimSpace(string(b))
}

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
		ID               string    `gorm:"column:id"`
		Name             string    `gorm:"column:name"`
		Host             string    `gorm:"column:host"`
		Port             int       `gorm:"column:port"`
		Username         string    `gorm:"column:username"`
		AuthType         string    `gorm:"column:authType"`
		Password         *string   `gorm:"column:password"`
		PrivateKey       *string   `gorm:"column:privateKey"`
		Status           string    `gorm:"column:status"`
		LastCheckAt      int64     `gorm:"column:lastCheckAt"`
		MaxContainers    int       `gorm:"column:maxContainers"`
		CPUCores         int       `gorm:"column:cpuCores"`
		CPUModel         *string   `gorm:"column:cpuModel"`
		TotalMemory      int       `gorm:"column:totalMemory"`
		ActiveContainers int       `gorm:"column:activeContainers"`
		CPUUsage         float64   `gorm:"column:cpuUsage"`
		MemoryUsage      float64   `gorm:"column:memoryUsage"`
		CreatedAt        int64     `gorm:"column:createdAt"`
		UpdatedAt        int64     `gorm:"column:updatedAt"`
		ContainerCount   int64     `gorm:"column:containerCount"`
	}

	var rows []row
	err := h.db.Table("servers s").
		Select("s.id, s.name, s.host, s.port, s.username, s.authType, s.password, s.privateKey, s.status, cast(s.lastCheckAt as integer) as lastCheckAt, s.maxContainers, s.cpuCores, s.cpuModel, s.totalMemory, s.activeContainers, s.cpuUsage, s.memoryUsage, cast(s.createdAt as integer) as createdAt, cast(s.updatedAt as integer) as updatedAt, (SELECT COUNT(1) FROM containers c WHERE c.serverId = s.id) as containerCount").
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
	s, ok := h.findServerForAdmin(id)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"message": "Server not found"})
		return
	}
	if s.Status != "online" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Server is offline"})
		return
	}

	dockerResp, err := h.dockerRequest(s, http.MethodGet, "/containers/json?all=1", nil, nil)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to list containers: " + err.Error()})
		return
	}
	defer dockerResp.Body.Close()
	if dockerResp.StatusCode >= 400 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to list containers: " + readDockerError(dockerResp)})
		return
	}

	var containers []dockerContainerSummary
	if err := json.NewDecoder(dockerResp.Body).Decode(&containers); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to parse containers response"})
		return
	}

	containerResp := make([]gin.H, 0, len(containers))
	for _, ct := range containers {
		name := ct.ID
		if len(ct.Names) > 0 {
			name = strings.TrimPrefix(ct.Names[0], "/")
		}
		containerResp = append(containerResp, gin.H{
			"id":      ct.ID,
			"name":    name,
			"image":   ct.Image,
			"status":  ct.State,
			"created": time.Unix(ct.Created, 0).UTC().Format(time.RFC3339),
			"ports":   ct.Ports,
		})
	}
	c.JSON(http.StatusOK, gin.H{"containers": containerResp})
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
	s, _ := h.findServerForAdmin(serverID)
	if s.Status != "online" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Server is offline"})
		return
	}

	resp, err := h.dockerRequest(s, http.MethodPost, "/containers/"+url.PathEscape(containerID)+"/start", nil, nil)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to start container: " + err.Error()})
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to start container: " + readDockerError(resp)})
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
	s, _ := h.findServerForAdmin(serverID)
	if s.Status != "online" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Server is offline"})
		return
	}

	resp, err := h.dockerRequest(s, http.MethodPost, "/containers/"+url.PathEscape(containerID)+"/stop?t=10", nil, nil)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to stop container: " + err.Error()})
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to stop container: " + readDockerError(resp)})
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
	s, _ := h.findServerForAdmin(serverID)
	if s.Status != "online" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Server is offline"})
		return
	}

	resp, err := h.dockerRequest(s, http.MethodDelete, "/containers/"+url.PathEscape(containerID)+"?force=1", nil, nil)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to remove container: " + err.Error()})
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to remove container: " + readDockerError(resp)})
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
	s, ok := h.findServerForAdmin(id)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"message": "Server not found"})
		return
	}
	if s.Status != "online" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Server is offline"})
		return
	}
	resp, err := h.dockerRequest(s, http.MethodGet, "/images/json", nil, nil)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to list images: " + err.Error()})
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to list images: " + readDockerError(resp)})
		return
	}

	var images []dockerImageSummary
	if err := json.NewDecoder(resp.Body).Decode(&images); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to parse images response"})
		return
	}
	out := make([]gin.H, 0, len(images))
	for _, img := range images {
		out = append(out, gin.H{
			"id":      img.ID,
			"tags":    img.RepoTags,
			"size":    img.Size,
			"created": time.Unix(img.Created, 0).UTC().Format(time.RFC3339),
		})
	}

	c.JSON(http.StatusOK, gin.H{"images": out})
}

func (h *Handler) PullServerImage(c *gin.Context) {
	id := c.Param("id")
	s, ok := h.findServerForAdmin(id)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"message": "Server not found"})
		return
	}
	if s.Status != "online" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Server is offline"})
		return
	}

	var req pullImageReq
	if err := c.ShouldBindJSON(&req); err != nil || req.ImageName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "imageName is required"})
		return
	}
	tag := req.Tag
	if tag == "" {
		tag = "latest"
	}
	path := "/images/create?fromImage=" + url.QueryEscape(req.ImageName) + "&tag=" + url.QueryEscape(tag)
	resp, err := h.dockerRequest(s, http.MethodPost, path, nil, nil)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to pull image: " + err.Error()})
		return
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	logs := []string{}
	for _, line := range strings.Split(string(body), "\n") {
		line = strings.TrimSpace(line)
		if line != "" {
			logs = append(logs, line)
		}
	}
	if resp.StatusCode >= 400 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to pull image", "logs": logs})
		return
	}
	if len(logs) == 0 {
		logs = []string{"pull completed"}
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "Image pulled successfully",
		"image":   req.ImageName + ":" + tag,
		"logs":    logs,
	})
}

func (h *Handler) BuildServerImage(c *gin.Context) {
	id := c.Param("id")
	s, ok := h.findServerForAdmin(id)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"message": "Server not found"})
		return
	}
	if s.Status != "online" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Server is offline"})
		return
	}

	var req buildImageReq
	if err := c.ShouldBindJSON(&req); err != nil || req.ImageName == "" || req.Dockerfile == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "dockerfile and imageName are required"})
		return
	}
	tag := req.Tag
	if tag == "" {
		tag = "latest"
	}

	var buf bytes.Buffer
	tw := tar.NewWriter(&buf)
	content := []byte(req.Dockerfile)
	hdr := &tar.Header{Name: "Dockerfile", Mode: 0644, Size: int64(len(content))}
	if err := tw.WriteHeader(hdr); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to build context"})
		return
	}
	if _, err := tw.Write(content); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to build context"})
		return
	}
	if err := tw.Close(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to build context"})
		return
	}

	buildPath := "/build?t=" + url.QueryEscape(req.ImageName+":"+tag) + "&rm=1&forcerm=1"
	resp, err := h.dockerRequest(s, http.MethodPost, buildPath, bytes.NewReader(buf.Bytes()), map[string]string{
		"Content-Type": "application/x-tar",
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to build image: " + err.Error()})
		return
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	logs := []string{}
	for _, line := range strings.Split(string(body), "\n") {
		line = strings.TrimSpace(line)
		if line != "" {
			logs = append(logs, line)
		}
	}
	if resp.StatusCode >= 400 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to build image", "logs": logs})
		return
	}
	if len(logs) == 0 {
		logs = []string{"build completed"}
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "Image built successfully",
		"image":   req.ImageName + ":" + tag,
		"logs":    logs,
	})
}

func (h *Handler) RemoveServerImage(c *gin.Context) {
	id := c.Param("id")
	imageID := c.Param("imageId")
	s, ok := h.findServerForAdmin(id)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"message": "Server not found"})
		return
	}
	if s.Status != "online" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Server is offline"})
		return
	}

	resp, err := h.dockerRequest(s, http.MethodDelete, "/images/"+url.PathEscape(imageID)+"?force=1", nil, nil)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to remove image: " + err.Error()})
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to remove image: " + readDockerError(resp)})
		return
	}
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

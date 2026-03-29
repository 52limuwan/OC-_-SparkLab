package router

import (
	"net/http"
	"time"

	"bigdata_zhoc/backend-go/internal/auth"
	"bigdata_zhoc/backend-go/internal/config"
	"bigdata_zhoc/backend-go/internal/handler"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func New(cfg *config.Config, db *gorm.DB) *gin.Engine {
	r := gin.Default()
	if err := r.SetTrustedProxies([]string{"127.0.0.1", "::1"}); err != nil {
		panic(err)
	}

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.FrontendURL},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	h := handler.New(db, cfg)

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})
	r.GET("/agent/install.sh", h.AgentInstallScript)
	r.GET("/agent/agent-http.py", h.AgentHTTPPythonFile)
	r.GET("/agent/agent.py", h.AgentPythonFile)
	r.POST("/agent/register", h.AgentRegister)
	r.POST("/agent/heartbeat", h.AgentHeartbeat)

	authGroup := r.Group("/auth")
	{
		authGroup.POST("/register", h.Register)
		authGroup.POST("/login", h.Login)
		authGroup.POST("/logout", h.Logout)
		authGroup.GET("/profile", h.GetProfile)
		authGroup.PUT("/profile", auth.JWTAuth(cfg.JWTSecret), h.UpdateProfile)
		authGroup.GET("/stats", auth.JWTAuth(cfg.JWTSecret), h.GetStats)
		authGroup.GET("/check", auth.JWTAuth(cfg.JWTSecret), h.CheckAuth)
	}

	courseGroup := r.Group("/courses")
	courseGroup.Use(auth.OptionalJWTAuth(cfg.JWTSecret))
	{
		courseGroup.GET("", h.GetCourses)
		courseGroup.GET("/:id", h.GetCourse)
		courseGroup.POST("/:id/enroll", auth.JWTAuth(cfg.JWTSecret), h.EnrollCourse)
		courseGroup.GET("/:id/progress", auth.JWTAuth(cfg.JWTSecret), h.GetCourseProgress)
	}

	labGroup := r.Group("/labs")
	labGroup.Use(auth.OptionalJWTAuth(cfg.JWTSecret))
	{
		labGroup.GET("/:id", h.GetLab)
		labGroup.GET("/course/:courseId", h.GetLabsByCourse)
		labGroup.POST("/:id/submit", auth.JWTAuth(cfg.JWTSecret), h.SubmitLab)
	}

	containerGroup := r.Group("/containers")
	containerGroup.Use(auth.JWTAuth(cfg.JWTSecret))
	{
		containerGroup.POST("", h.CreateContainer)
		containerGroup.GET("", h.GetContainers)
		containerGroup.GET("/:id", h.GetContainer)
		containerGroup.POST("/:id/start", h.StartContainer)
		containerGroup.POST("/:id/stop", h.StopContainer)
		containerGroup.DELETE("/:id", h.RemoveContainer)
		containerGroup.POST("/:id/heartbeat", h.ContainerHeartbeat)
		containerGroup.POST("/:id/exec", h.ExecContainer)
		containerGroup.POST("/:id/exec/create", h.ExecCreateContainer)
		containerGroup.POST("/:id/exec/start", h.ExecStartContainer)
	}

	snapshotGroup := r.Group("/snapshots")
	snapshotGroup.Use(auth.JWTAuth(cfg.JWTSecret))
	{
		snapshotGroup.POST("", h.CreateSnapshot)
		snapshotGroup.GET("", h.GetSnapshots)
		snapshotGroup.GET("/:id", h.GetSnapshot)
		snapshotGroup.POST("/:id/restore", h.RestoreSnapshot)
		snapshotGroup.DELETE("/:id", h.RemoveSnapshot)
	}

	adminGroup := r.Group("/admin")
	adminGroup.Use(auth.JWTAuth(cfg.JWTSecret), h.RequireAdmin())
	{
		adminGroup.GET("/stats", h.AdminStats)
		adminGroup.GET("/users", h.AdminGetUsers)
		adminGroup.POST("/users", h.AdminCreateUser)
		adminGroup.PUT("/users/:id", h.AdminUpdateUser)
		adminGroup.DELETE("/users/:id", h.AdminDeleteUser)
		adminGroup.POST("/courses", h.AdminCreateCourse)
		adminGroup.PUT("/courses/:id", h.AdminUpdateCourse)
		adminGroup.DELETE("/courses/:id", h.AdminDeleteCourse)
		adminGroup.POST("/labs", h.AdminCreateLab)
		adminGroup.PUT("/labs/:id", h.AdminUpdateLab)
		adminGroup.DELETE("/labs/:id", h.AdminDeleteLab)
		adminGroup.GET("/containers", h.AdminGetContainers)
		adminGroup.POST("/containers/:id/force-stop", h.AdminForceStopContainer)
		adminGroup.GET("/servers/:serverId/available-port", h.AdminGetAvailablePort)
	}

	serverGroup := r.Group("/servers")
	serverGroup.Use(auth.JWTAuth(cfg.JWTSecret), h.RequireAdmin())
	{
		serverGroup.POST("", h.CreateServer)
		serverGroup.GET("", h.GetServers)
		serverGroup.GET("/:id", h.GetServer)
		serverGroup.GET("/:id/containers", h.GetServerContainers)
		serverGroup.GET("/:id/images", h.GetServerImages)
		serverGroup.POST("/:id/images/pull", h.PullServerImage)
		serverGroup.POST("/:id/images/build", h.BuildServerImage)
		serverGroup.DELETE("/:id/images/:imageId", h.RemoveServerImage)
		serverGroup.POST("/:id/containers/:containerId/start", h.StartServerContainer)
		serverGroup.POST("/:id/containers/:containerId/stop", h.StopServerContainer)
		serverGroup.DELETE("/:id/containers/:containerId", h.RemoveServerContainer)
		serverGroup.PUT("/:id", h.UpdateServer)
		serverGroup.DELETE("/:id", h.DeleteServer)
	}

	return r
}

package handler

import (
	"net/http"
	"time"

	"bigdata_zhoc/backend-go/internal/auth"
	"bigdata_zhoc/backend-go/internal/model"
	"bigdata_zhoc/backend-go/internal/util"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type registerReq struct {
	Username    string  `json:"username"`
	DisplayName string  `json:"displayName"`
	Password    string  `json:"password"`
	QQNumber    *string `json:"qqNumber"`
}

type loginReq struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type updateProfileReq struct {
	Username    *string `json:"username"`
	DisplayName *string `json:"displayName"`
	QQNumber    *string `json:"qqNumber"`
}

func (h *Handler) Register(c *gin.Context) {
	var req registerReq
	if err := c.ShouldBindJSON(&req); err != nil {
		util.BadRequest(c, "Invalid payload")
		return
	}

	if req.Username == "" || req.DisplayName == "" || req.Password == "" {
		util.BadRequest(c, "username, displayName and password are required")
		return
	}

	var existing model.User
	err := h.db.Where("username = ?", req.Username).First(&existing).Error
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"message": "Username or QQ number already exists"})
		return
	}

	if req.QQNumber != nil && *req.QQNumber != "" {
		err = h.db.Where("qqNumber = ?", *req.QQNumber).First(&existing).Error
		if err == nil {
			c.JSON(http.StatusConflict, gin.H{"message": "Username or QQ number already exists"})
			return
		}
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
	if err != nil {
		util.Error(c, http.StatusInternalServerError, "Hash password failed")
		return
	}

	u := model.User{
		ID:           newID(),
		Username:     req.Username,
		DisplayName:  req.DisplayName,
		Email:        req.Username + "@sparklab.local",
		Password:     string(hashed),
		Role:         "STUDENT",
		QQNumber:     req.QQNumber,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
		LastActiveAt: time.Now(),
	}

	if err := h.db.Create(&u).Error; err != nil {
		util.Error(c, http.StatusInternalServerError, "Create user failed")
		return
	}

	c.JSON(http.StatusCreated, sanitizeUser(u))
}

func (h *Handler) Login(c *gin.Context) {
	var req loginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		util.BadRequest(c, "Invalid payload")
		return
	}

	var u model.User
	err := h.db.Where("username = ? OR qqNumber = ?", req.Username, req.Username).First(&u).Error
	if err != nil {
		util.Unauthorized(c, "Invalid credentials")
		return
	}

	if bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(req.Password)) != nil {
		util.Unauthorized(c, "Invalid credentials")
		return
	}

	token, err := auth.SignToken(h.cfg.JWTSecret, u.ID, u.Username, u.Role, h.cfg.JWTExpires)
	if err != nil {
		util.Error(c, http.StatusInternalServerError, "Sign token failed")
		return
	}

	h.db.Model(&model.User{}).Where("id = ?", u.ID).Update("lastActiveAt", time.Now())

	c.SetCookie("access_token", token, 7*24*3600, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{
		"access_token": token,
		"user":         sanitizeUser(u),
	})
}

func (h *Handler) Logout(c *gin.Context) {
	c.SetCookie("access_token", "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

func (h *Handler) GetProfile(c *gin.Context) {
	token, ok := authTokenFromRequest(c)
	if !ok {
		c.JSON(http.StatusOK, gin.H{"authenticated": false, "user": nil})
		return
	}

	claims, err := auth.ParseToken(token, h.cfg.JWTSecret)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"authenticated": false, "user": nil})
		return
	}

	var u model.User
	if err := h.db.Where("id = ?", claims.Sub).First(&u).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"authenticated": false, "user": nil})
		return
	}

	c.JSON(http.StatusOK, gin.H{"authenticated": true, "user": sanitizeUser(u)})
}

func (h *Handler) CheckAuth(c *gin.Context) {
	uid, _ := userIDFromCtx(c)
	var u model.User
	if err := h.db.Where("id = ?", uid).First(&u).Error; err != nil {
		util.Unauthorized(c, "Unauthorized")
		return
	}
	c.JSON(http.StatusOK, gin.H{"authenticated": true, "user": sanitizeUser(u)})
}

func (h *Handler) UpdateProfile(c *gin.Context) {
	uid, _ := userIDFromCtx(c)

	var req updateProfileReq
	if err := c.ShouldBindJSON(&req); err != nil {
		util.BadRequest(c, "Invalid payload")
		return
	}

	updates := map[string]any{"updatedAt": time.Now()}
	if req.Username != nil {
		updates["username"] = *req.Username
	}
	if req.DisplayName != nil {
		updates["displayName"] = *req.DisplayName
	}
	if req.QQNumber != nil {
		updates["qqNumber"] = *req.QQNumber
	}

	if err := h.db.Model(&model.User{}).Where("id = ?", uid).Updates(updates).Error; err != nil {
		if err == gorm.ErrDuplicatedKey {
			c.JSON(http.StatusConflict, gin.H{"message": "Username already exists"})
			return
		}
		util.Error(c, http.StatusInternalServerError, "Update failed")
		return
	}

	var u model.User
	h.db.Where("id = ?", uid).First(&u)
	c.JSON(http.StatusOK, sanitizeUser(u))
}

func (h *Handler) GetStats(c *gin.Context) {
	uid, _ := userIDFromCtx(c)

	var enrolledCourses int64
	h.db.Model(&model.Enrollment{}).Where("userId = ?", uid).Count(&enrolledCourses)

	var completedLabs int64
	h.db.Model(&model.Submission{}).Where("userId = ? AND status = ?", uid, "passed").Count(&completedLabs)

	var passedSubs []model.Submission
	h.db.Where("userId = ? AND status = ?", uid, "passed").Find(&passedSubs)
	totalScore := 0
	for _, s := range passedSubs {
		totalScore += s.Score
	}

	c.JSON(http.StatusOK, gin.H{
		"enrolledCourses": enrolledCourses,
		"completedLabs":   completedLabs,
		"totalScore":      totalScore,
		"studyTime":       0,
	})
}

type userResp struct {
	ID          string  `json:"id"`
	Username    string  `json:"username"`
	DisplayName string  `json:"displayName"`
	Email       string  `json:"email"`
	Role        string  `json:"role"`
	Avatar      *string `json:"avatar,omitempty"`
	QQNumber    *string `json:"qqNumber,omitempty"`
}

func sanitizeUser(u model.User) userResp {
	return userResp{
		ID:          u.ID,
		Username:    u.Username,
		DisplayName: u.DisplayName,
		Email:       u.Email,
		Role:        u.Role,
		Avatar:      u.Avatar,
		QQNumber:    u.QQNumber,
	}
}

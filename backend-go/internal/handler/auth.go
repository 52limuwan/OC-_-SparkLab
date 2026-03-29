package handler

import (
	"errors"
	"net/http"

	"bigdata_zhoc/backend-go/internal/auth"
	"bigdata_zhoc/backend-go/internal/model"
	"bigdata_zhoc/backend-go/internal/util"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type authUserRecord struct {
	ID          string  `gorm:"column:id"`
	Username    string  `gorm:"column:username"`
	DisplayName string  `gorm:"column:displayName"`
	Email       string  `gorm:"column:email"`
	Password    string  `gorm:"column:password"`
	Role        string  `gorm:"column:role"`
	Avatar      *string `gorm:"column:avatar"`
	QQNumber    *string `gorm:"column:qqNumber"`
}

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

	var existing struct {
		ID string `gorm:"column:id"`
	}
	err := h.db.Table("users").Select("id").Where("username = ?", req.Username).Take(&existing).Error
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"message": "Username or QQ number already exists"})
		return
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		util.Error(c, http.StatusInternalServerError, "Check username failed")
		return
	}

	if req.QQNumber != nil && *req.QQNumber != "" {
		err = h.db.Table("users").Select("id").Where("qqNumber = ?", *req.QQNumber).Take(&existing).Error
		if err == nil {
			c.JSON(http.StatusConflict, gin.H{"message": "Username or QQ number already exists"})
			return
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			util.Error(c, http.StatusInternalServerError, "Check QQ number failed")
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
		CreatedAt:    model.Now(),
		UpdatedAt:    model.Now(),
		LastActiveAt: model.Now(),
	}

	if err := h.db.Create(&u).Error; err != nil {
		util.Error(c, http.StatusInternalServerError, "Create user failed")
		return
	}

	c.JSON(http.StatusCreated, sanitizeModelUser(u))
}

func (h *Handler) Login(c *gin.Context) {
	var req loginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		util.BadRequest(c, "Invalid payload")
		return
	}

	var u authUserRecord
	err := h.db.Table("users").
		Select("id, username, displayName, email, password, role, avatar, qqNumber").
		Where("username = ? OR qqNumber = ?", req.Username, req.Username).
		Take(&u).Error
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

	h.db.Model(&model.User{}).Where("id = ?", u.ID).Update("lastActiveAt", model.Now())

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

	var u authUserRecord
	if err := h.db.Table("users").
		Select("id, username, displayName, email, password, role, avatar, qqNumber").
		Where("id = ?", claims.Subject).
		Take(&u).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"authenticated": false, "user": nil})
		return
	}

	c.JSON(http.StatusOK, gin.H{"authenticated": true, "user": sanitizeUser(u)})
}

func (h *Handler) CheckAuth(c *gin.Context) {
	uid, _ := userIDFromCtx(c)
	var u authUserRecord
	if err := h.db.Table("users").
		Select("id, username, displayName, email, password, role, avatar, qqNumber").
		Where("id = ?", uid).
		Take(&u).Error; err != nil {
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

	updates := map[string]any{"updatedAt": model.Now()}
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

	var u authUserRecord
	h.db.Table("users").
		Select("id, username, displayName, email, password, role, avatar, qqNumber").
		Where("id = ?", uid).
		Take(&u)
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

func sanitizeUser(u authUserRecord) userResp {
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

func sanitizeModelUser(u model.User) userResp {
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

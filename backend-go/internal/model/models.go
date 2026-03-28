package model

import "time"

type User struct {
	ID           string    `gorm:"column:id;primaryKey" json:"id"`
	Username     string    `gorm:"column:username" json:"username"`
	DisplayName  string    `gorm:"column:displayName" json:"displayName"`
	Email        string    `gorm:"column:email" json:"email"`
	Password     string    `gorm:"column:password" json:"-"`
	Role         string    `gorm:"column:role" json:"role"`
	Avatar       *string   `gorm:"column:avatar" json:"avatar,omitempty"`
	QQNumber     *string   `gorm:"column:qqNumber" json:"qqNumber,omitempty"`
	CreatedAt    time.Time `gorm:"column:createdAt" json:"createdAt"`
	UpdatedAt    time.Time `gorm:"column:updatedAt" json:"-"`
	LastActiveAt time.Time `gorm:"column:lastActiveAt" json:"lastActiveAt"`
}

func (User) TableName() string { return "users" }

type Course struct {
	ID          string    `gorm:"column:id;primaryKey" json:"id"`
	Title       string    `gorm:"column:title" json:"title"`
	Description string    `gorm:"column:description" json:"description"`
	Cover       *string   `gorm:"column:cover" json:"cover,omitempty"`
	Difficulty  string    `gorm:"column:difficulty" json:"difficulty"`
	Duration    int       `gorm:"column:duration" json:"duration"`
	IsPublished bool      `gorm:"column:isPublished" json:"isPublished"`
	CreatedAt   time.Time `gorm:"column:createdAt" json:"createdAt"`
	UpdatedAt   time.Time `gorm:"column:updatedAt" json:"updatedAt"`
}

func (Course) TableName() string { return "courses" }

type Lab struct {
	ID              string    `gorm:"column:id;primaryKey" json:"id"`
	CourseID        string    `gorm:"column:courseId" json:"courseId"`
	Title           string    `gorm:"column:title" json:"title"`
	Description     string    `gorm:"column:description" json:"description"`
	Content         string    `gorm:"column:content" json:"content"`
	Difficulty      string    `gorm:"column:difficulty" json:"difficulty"`
	Order           int       `gorm:"column:order" json:"order"`
	Points          int       `gorm:"column:points" json:"points"`
	TimeLimit       int       `gorm:"column:timeLimit" json:"timeLimit"`
	ServerID        *string   `gorm:"column:serverId" json:"serverId,omitempty"`
	DockerImage     string    `gorm:"column:dockerImage" json:"dockerImage"`
	CPULimit        float64   `gorm:"column:cpuLimit" json:"cpuLimit"`
	MemoryLimit     int       `gorm:"column:memoryLimit" json:"memoryLimit"`
	ShellCmd        string    `gorm:"column:shellCommand" json:"shellCommand"`
	PortMappings    *string   `gorm:"column:portMappings" json:"portMappings,omitempty"`
	EnvironmentVars *string   `gorm:"column:environmentVars" json:"environmentVars,omitempty"`
	VolumeMounts    *string   `gorm:"column:volumeMounts" json:"volumeMounts,omitempty"`
	RestartPolicy   string    `gorm:"column:restartPolicy" json:"restartPolicy"`
	JudgeType       string    `gorm:"column:judgeType" json:"judgeType"`
	JudgeScript     *string   `gorm:"column:judgeScript" json:"judgeScript,omitempty"`
	CreatedAt       time.Time `gorm:"column:createdAt" json:"createdAt"`
	UpdatedAt       time.Time `gorm:"column:updatedAt" json:"updatedAt"`
}

func (Lab) TableName() string { return "labs" }

type Step struct {
	ID      string  `gorm:"column:id;primaryKey" json:"id"`
	LabID   string  `gorm:"column:labId" json:"labId"`
	Title   string  `gorm:"column:title" json:"title"`
	Content string  `gorm:"column:content" json:"content"`
	Order   int     `gorm:"column:order" json:"order"`
	Hint    *string `gorm:"column:hint" json:"hint,omitempty"`
}

func (Step) TableName() string { return "steps" }

type Enrollment struct {
	ID          string     `gorm:"column:id;primaryKey" json:"id"`
	UserID      string     `gorm:"column:userId" json:"userId"`
	CourseID    string     `gorm:"column:courseId" json:"courseId"`
	Progress    int        `gorm:"column:progress" json:"progress"`
	StartedAt   time.Time  `gorm:"column:startedAt" json:"startedAt"`
	CompletedAt *time.Time `gorm:"column:completedAt" json:"completedAt,omitempty"`
}

func (Enrollment) TableName() string { return "enrollments" }

type Submission struct {
	ID          string    `gorm:"column:id;primaryKey" json:"id"`
	UserID      string    `gorm:"column:userId" json:"userId"`
	LabID       string    `gorm:"column:labId" json:"labId"`
	Score       int       `gorm:"column:score" json:"score"`
	MaxScore    int       `gorm:"column:maxScore" json:"maxScore"`
	Status      string    `gorm:"column:status" json:"status"`
	Output      *string   `gorm:"column:output" json:"output,omitempty"`
	Logs        *string   `gorm:"column:logs" json:"logs,omitempty"`
	SubmittedAt time.Time `gorm:"column:submittedAt" json:"submittedAt"`
}

func (Submission) TableName() string { return "submissions" }

type Container struct {
	ID           string     `gorm:"column:id;primaryKey" json:"id"`
	UserID       string     `gorm:"column:userId" json:"userId"`
	LabID        string     `gorm:"column:labId" json:"labId"`
	ServerID     *string    `gorm:"column:serverId" json:"serverId,omitempty"`
	ContainerID  string     `gorm:"column:containerId" json:"containerId"`
	Status       string     `gorm:"column:status" json:"status"`
	PortMappings *string    `gorm:"column:portMappings" json:"portMappings,omitempty"`
	CPULimit     float64    `gorm:"column:cpuLimit" json:"cpuLimit"`
	MemoryLimit  int        `gorm:"column:memoryLimit" json:"memoryLimit"`
	CreatedAt    time.Time  `gorm:"column:createdAt" json:"createdAt"`
	StartedAt    *time.Time `gorm:"column:startedAt" json:"startedAt,omitempty"`
	StoppedAt    *time.Time `gorm:"column:stoppedAt" json:"stoppedAt,omitempty"`
	LastActiveAt time.Time  `gorm:"column:lastActiveAt" json:"lastActiveAt"`
	AutoStopAt   *time.Time `gorm:"column:autoStopAt" json:"autoStopAt,omitempty"`
}

func (Container) TableName() string { return "containers" }

type Snapshot struct {
	ID          string    `gorm:"column:id;primaryKey" json:"id"`
	UserID      string    `gorm:"column:userId" json:"userId"`
	ContainerID string    `gorm:"column:containerId" json:"containerId"`
	ImageID     string    `gorm:"column:imageId" json:"imageId"`
	Name        string    `gorm:"column:name" json:"name"`
	Description *string   `gorm:"column:description" json:"description,omitempty"`
	Size        int       `gorm:"column:size" json:"size"`
	CreatedAt   time.Time `gorm:"column:createdAt" json:"createdAt"`
}

func (Snapshot) TableName() string { return "snapshots" }

type Server struct {
	ID               string    `gorm:"column:id;primaryKey" json:"id"`
	Name             string    `gorm:"column:name" json:"name"`
	Host             string    `gorm:"column:host" json:"host"`
	Port             int       `gorm:"column:port" json:"port"`
	Username         string    `gorm:"column:username" json:"username"`
	AuthType         string    `gorm:"column:authType" json:"authType"`
	Password         *string   `gorm:"column:password" json:"-"`
	PrivateKey       *string   `gorm:"column:privateKey" json:"-"`
	Status           string    `gorm:"column:status" json:"status"`
	LastCheckAt      time.Time `gorm:"column:lastCheckAt" json:"lastCheckAt"`
	MaxContainers    int       `gorm:"column:maxContainers" json:"maxContainers"`
	CPUCores         int       `gorm:"column:cpuCores" json:"cpuCores"`
	CPUModel         *string   `gorm:"column:cpuModel" json:"cpuModel,omitempty"`
	TotalMemory      int       `gorm:"column:totalMemory" json:"totalMemory"`
	ActiveContainers int       `gorm:"column:activeContainers" json:"activeContainers"`
	CPUUsage         float64   `gorm:"column:cpuUsage" json:"cpuUsage"`
	MemoryUsage      float64   `gorm:"column:memoryUsage" json:"memoryUsage"`
	CreatedAt        time.Time `gorm:"column:createdAt" json:"createdAt"`
	UpdatedAt        time.Time `gorm:"column:updatedAt" json:"updatedAt"`
}

func (Server) TableName() string { return "servers" }

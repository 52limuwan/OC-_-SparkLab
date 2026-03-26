# 个人资料功能

## 功能概述

完善了 explore 页面的个人资料功能，用户现在可以查看和编辑个人信息，查看学习统计数据。

## 新增功能

### 1. 个人资料页面 (`/profile`)

- 用户信息展示
  - 头像显示（支持 QQ 头像或默认头像）
  - 用户名、QQ号
  - 用户角色标签（学生/教师/管理员）

- 个人信息编辑
  - 可编辑用户名、QQ号
  - 实时验证和错误提示
  - 保存后自动更新

- 学习统计
  - 已注册课程数
  - 完成实验数
  - 总积分
  - 学习时长

- 最近活动
  - 预留活动记录展示区域

### 2. 后端 API

#### 更新个人资料
```
PUT /auth/profile
Body: {
  username?: string,
  qqNumber?: string,
  avatar?: string
}
```

#### 获取用户统计
```
GET /auth/stats
Response: {
  enrolledCourses: number,
  completedLabs: number,
  totalScore: number,
  studyTime: number (分钟)
}
```

### 3. UI 改进

- Sidebar 底部用户卡片现在可点击跳转到个人资料页面
- 用户卡片显示用户名和角色（不再显示邮箱）
- 个人资料页面采用响应式布局
- 统计卡片使用不同颜色区分不同指标

## 技术实现

### 前端
- 使用 Next.js 14 App Router
- Zustand 状态管理
- Tailwind CSS 样式
- Lucide React 图标

### 后端
- NestJS 框架
- Prisma ORM
- JWT 认证
- 数据验证和冲突检测

## 使用方式

1. 登录后点击左侧导航栏的"个人资料"
2. 或点击 Sidebar 底部的用户卡片
3. 在个人资料页面点击"编辑资料"按钮
4. 修改信息后点击"保存"
5. 查看学习统计数据

## 注意事项

- 用户名、QQ号必须唯一
- 用户名至少 3 个字符
- QQ号用于显示 QQ 头像
- 系统不再使用邮箱功能，邮箱字段仅用于内部标识

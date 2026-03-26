# 学生名字（DisplayName）功能

## 功能概述

添加了"学生名字"（displayName）字段，用于在系统中显示用户的真实姓名。用户可以通过用户名或QQ号登录，但登录后系统显示的是学生名字。

## 主要变更

### 1. 数据库模型

在 User 模型中添加了 `displayName` 字段：

```prisma
model User {
  id            String   @id @default(uuid())
  username      String   @unique          // 用于登录
  displayName   String   @default("未命名") // 用于显示
  email         String   @unique
  password      String
  role          String   @default("STUDENT")
  avatar        String?
  qqNumber      String?
  // ...
}
```

### 2. 注册流程

注册时需要填写：
- 用户名（登录用）：至少3个字符，用于登录
- 学生名字（显示用）：至少2个字符，真实姓名
- QQ号（可选）：用于显示QQ头像
- 密码：至少6个字符

### 3. 登录方式

用户可以使用以下任一方式登录：
- 用户名 + 密码
- QQ号 + 密码

登录后，系统显示的是学生名字（displayName），而不是用户名。

### 4. 显示位置

学生名字会显示在以下位置：
- Sidebar 底部用户卡片
- 个人资料页面标题
- 管理员用户列表
- 容器管理页面
- 所有需要显示用户信息的地方

### 5. 个人资料编辑

用户可以在个人资料页面编辑：
- 用户名（登录用）
- 学生名字（显示用）
- QQ号

### 6. 管理员功能

管理员创建/编辑用户时需要提供：
- username: 用户名
- displayName: 学生名字
- password: 密码
- role: 角色（可选）
- qqNumber: QQ号（可选）

## API 变更

### 注册接口
```
POST /auth/register
Body: {
  username: string,      // 用户名（登录用）
  displayName: string,   // 学生名字（显示用）
  password: string,
  qqNumber?: string
}
```

### 更新个人资料接口
```
PUT /auth/profile
Body: {
  username?: string,
  displayName?: string,
  qqNumber?: string,
  avatar?: string
}
```

### 管理员创建用户接口
```
POST /admin/users
Body: {
  username: string,
  displayName: string,
  password: string,
  role?: string,
  qqNumber?: string
}
```

## 数据迁移

已创建数据库迁移 `20260326144227_add_display_name`，为现有用户添加默认值"未命名"。

### 迁移步骤

1. 运行迁移：
```bash
cd backend
npx prisma migrate dev
```

2. 重新生成 Prisma Client：
```bash
npx prisma generate
```

或者运行批处理文件：
```bash
cd backend
regenerate-prisma-client.bat
```

3. 更新种子数据：
```bash
npx prisma db seed
```

## 前端变更

### 组件更新
- `frontend/src/app/register/page.tsx` - 添加学生名字输入框
- `frontend/src/app/profile/page.tsx` - 添加学生名字编辑功能
- `frontend/src/components/Sidebar.tsx` - 显示学生名字而不是用户名
- `frontend/src/app/admin/users/page.tsx` - 管理员用户管理页面添加学生名字字段
- `frontend/src/store/useAuthStore.ts` - User 接口添加 displayName 字段
- `frontend/src/lib/api.ts` - 更新 API 接口类型定义

### 显示逻辑
- 头像下方显示学生名字
- 用户卡片显示学生名字 + 角色
- 个人资料页面显示学生名字，用户名作为辅助信息
- 管理员用户列表显示学生名字，用户名显示为 @username

### 后端变更

### 服务更新
- `backend/src/auth/auth.service.ts` - 注册、登录、更新资料时处理 displayName
- `backend/src/auth/auth.controller.ts` - 更新接口类型定义
- `backend/src/admin/admin.service.ts` - 管理员操作时处理 displayName
- `backend/src/admin/admin.controller.ts` - 更新接口类型定义
- `backend/prisma/seed.ts` - 种子数据包含 displayName

### DTO 更新
- `RegisterDto` - 添加 displayName 字段（必填）
- `UpdateProfileDto` - 添加 displayName 字段（可选）

## 使用说明

### 新用户注册
1. 访问注册页面
2. 填写用户名（用于登录）
3. 填写学生名字（真实姓名）
4. 填写QQ号（可选）
5. 设置密码
6. 完成注册

### 现有用户
1. 登录系统
2. 进入个人资料页面
3. 点击"编辑资料"
4. 更新学生名字
5. 保存更改

### 管理员
1. 进入管理控制台
2. 用户管理页面会显示学生名字
3. 创建/编辑用户时需要填写学生名字

## 注意事项

1. displayName 字段有默认值"未命名"，确保向后兼容
2. 用户名仍然用于登录，不影响现有登录逻辑
3. 学生名字至少2个字符
4. 所有显示用户信息的地方都应该使用 displayName 而不是 username
5. 如果后端服务正在运行，需要停止后再运行 `npx prisma generate`

## 测试账号

更新后的测试账号：
- 管理员：username: `admin`, displayName: `管理员`, password: `admin123`
- 学生：username: `student`, displayName: `测试学生`, password: `student123`

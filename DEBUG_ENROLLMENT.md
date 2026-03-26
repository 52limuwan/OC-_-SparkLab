# 课程注册问题调试指南

## 问题描述
点击"立即注册"按钮后，按钮没有变成"进入学习"。

## 已实施的修复

### 1. 创建可选的 JWT 认证守卫
**文件**: `backend/src/auth/guards/optional-jwt-auth.guard.ts`

这个守卫允许：
- 已登录用户：正常获取用户信息
- 未登录用户：也能访问接口，但 user 为 null

### 2. 更新课程控制器
**文件**: `backend/src/course/course.controller.ts`

- `GET /courses` 使用 `OptionalJwtAuthGuard`
- `GET /courses/:id` 使用 `OptionalJwtAuthGuard`
- 这样已登录用户可以看到 `isEnrolled` 状态

### 3. 添加调试日志
在以下位置添加了 console.log：
- 前端：`handleEnroll` 函数
- 前端：`loadCourses` 函数
- 后端：`CourseService.findAll` 方法
- 后端：`CourseService.enroll` 方法

## 调试步骤

### 1. 打开浏览器开发者工具
按 F12 打开控制台

### 2. 访问课程中心
访问 http://localhost:3000/explore

查看控制台输出：
```
Loading courses...
Courses loaded: [...]
```

### 3. 点击"立即注册"
查看控制台输出：
```
Enrolling in course: course-1
Enrollment response: {...}
Loading courses...
Courses loaded: [...]
Courses reloaded
```

### 4. 检查后端日志
查看后端终端输出：
```
CourseService.enroll called: { courseId: 'course-1', userId: '...' }
Enrollment created/updated: {...}
CourseService.findAll called with userId: ...
Course course-1: isEnrolled=true, enrollments count=1
```

## 可能的问题和解决方案

### 问题 1: 用户未登录
**症状**: 点击按钮后跳转到登录页

**解决**: 确保用户已登录
```bash
# 使用测试账号登录
用户名: student
密码: student123
```

### 问题 2: JWT Token 未正确传递
**症状**: 后端日志显示 `userId: undefined`

**检查**:
1. 浏览器 Application -> Cookies -> 检查是否有 `access_token`
2. 如果没有，重新登录

**解决**: 
```typescript
// 确保 api.ts 中配置了 withCredentials
withCredentials: true
```

### 问题 3: 数据库连接问题
**症状**: 后端报错 "Database connection failed"

**解决**:
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

### 问题 4: 前端状态未更新
**症状**: 后端返回正确数据，但前端按钮未变化

**检查**: 浏览器控制台中的 "Courses loaded" 数据
```javascript
// 应该看到 isEnrolled: true
{
  id: "course-1",
  title: "...",
  isEnrolled: true  // 这个应该是 true
}
```

**解决**: 清除浏览器缓存并刷新页面

### 问题 5: 后端守卫未生效
**症状**: 后端日志显示 `userId: null` 即使用户已登录

**检查**: 
1. 确认 `OptionalJwtAuthGuard` 文件已创建
2. 确认课程控制器已导入并使用该守卫

**解决**: 重启后端服务
```bash
cd backend
npm run start:dev
```

## 验证修复

### 1. 完整测试流程
```bash
# 1. 启动后端
cd backend
npm run start:dev

# 2. 启动前端
cd frontend
npm run dev

# 3. 访问应用
打开 http://localhost:3000

# 4. 登录
用户名: student
密码: student123

# 5. 访问课程中心
点击侧边栏 "课程中心"

# 6. 注册课程
点击任意课程的 "立即注册" 按钮

# 7. 验证
按钮应该变为 "进入学习"
```

### 2. 检查数据库
```bash
cd backend
npx prisma studio
```

打开 Prisma Studio，查看 `Enrollment` 表，应该能看到新的注册记录。

### 3. API 测试
使用 Postman 或 curl 测试：

```bash
# 1. 登录获取 token
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"student","password":"student123"}' \
  -c cookies.txt

# 2. 注册课程
curl -X POST http://localhost:3001/courses/course-1/enroll \
  -b cookies.txt

# 3. 获取课程列表
curl -X GET http://localhost:3001/courses \
  -b cookies.txt
```

应该看到 `isEnrolled: true`

## 清理调试日志

修复完成后，可以移除调试日志：

### 前端
```typescript
// frontend/src/app/explore/page.tsx
// 移除所有 console.log 语句
```

### 后端
```typescript
// backend/src/course/course.service.ts
// 移除所有 console.log 语句
```

## 联系支持

如果问题仍然存在，请提供：
1. 浏览器控制台完整日志
2. 后端终端完整日志
3. 网络请求详情（Network 标签）
4. 数据库 Enrollment 表截图

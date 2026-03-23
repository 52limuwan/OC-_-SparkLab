# 🔐 用户认证系统使用指南

## ✅ 已实现的功能

### 1. 用户注册
**页面**: `/register`
**功能**:
- ✅ 用户名、邮箱、密码注册
- ✅ 密码确认验证
- ✅ 密码长度验证（最少6位）
- ✅ 学号字段（可选）
- ✅ 服务条款同意
- ✅ 第三方注册入口（GitHub/GitLab）
- ✅ 注册成功后跳转到登录页
- ✅ 已登录用户自动跳转到控制台
- ✅ 加载状态显示
- ✅ 错误提示

### 2. 用户登录
**页面**: `/login`
**功能**:
- ✅ 邮箱密码登录
- ✅ 记住登录状态（localStorage）
- ✅ 第三方登录入口（GitHub/GitLab）
- ✅ 忘记密码链接
- ✅ 登录成功后跳转到控制台
- ✅ 已登录用户自动跳转到控制台
- ✅ 加载状态显示
- ✅ 错误提示
- ✅ Token 和用户信息存储

### 3. 用户退出
**位置**: 顶部导航栏用户菜单
**功能**:
- ✅ 清除 Token
- ✅ 清除用户信息
- ✅ 跳转到登录页
- ✅ 退出确认

### 4. 用户菜单
**位置**: 顶部导航栏右侧
**功能**:
- ✅ 显示用户头像（首字母）
- ✅ 显示用户名和邮箱
- ✅ 快速导航（控制台、个人资料、我的实验）
- ✅ 退出登录按钮
- ✅ 点击外部自动关闭

### 5. 路由保护
**保护的页面**:
- ✅ `/dashboard` - 控制台
- ✅ `/lab` - 实验工作区
- ✅ `/lab/[id]` - 实验详情
- ✅ `/profile` - 个人资料
- ✅ `/admin/containers` - 容器管理

**功能**:
- ✅ 未登录用户自动跳转到登录页
- ✅ 加载状态显示
- ✅ 登录后返回原页面

## 📁 文件结构

```
frontend/src/
├── lib/
│   └── auth.ts                 # 认证工具函数
├── hooks/
│   └── useAuth.ts              # 认证 Hook
├── components/
│   ├── AuthGuard.tsx           # 路由保护组件
│   └── TopNavBar.tsx           # 顶部导航栏（含用户菜单）
└── app/
    ├── login/
    │   └── page.tsx            # 登录页面
    └── register/
        └── page.tsx            # 注册页面
```

## 🔧 核心功能说明

### 1. 认证工具函数 (`lib/auth.ts`)

```typescript
// 获取 Token
getToken(): string | null

// 设置 Token
setToken(token: string): void

// 移除 Token
removeToken(): void

// 获取当前用户
getCurrentUser(): User | null

// 设置用户信息
setCurrentUser(user: User): void

// 检查是否已登录
isAuthenticated(): boolean

// 退出登录
logout(): void
```

### 2. 认证 Hook (`hooks/useAuth.ts`)

```typescript
const { 
  user,           // 当前用户信息
  loading,        // 加载状态
  isAuthenticated,// 是否已登录
  logout,         // 退出函数
  requireAuth,    // 要求认证
  setUser         // 设置用户
} = useAuth()
```

### 3. 路由保护组件 (`components/AuthGuard.tsx`)

```tsx
<AuthGuard>
  <YourProtectedPage />
</AuthGuard>
```

## 🚀 使用示例

### 在页面中使用认证

```tsx
'use client'

import { useAuth } from '@/hooks/useAuth'
import AuthGuard from '@/components/AuthGuard'

export default function ProtectedPage() {
  const { user, logout } = useAuth()

  return (
    <AuthGuard>
      <div>
        <h1>欢迎, {user?.username}</h1>
        <button onClick={logout}>退出</button>
      </div>
    </AuthGuard>
  )
}
```

### 检查登录状态

```tsx
'use client'

import { useAuth } from '@/hooks/useAuth'

export default function MyComponent() {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <div>请先登录</div>
  }

  return <div>欢迎, {user?.username}</div>
}
```

### 手动退出登录

```tsx
import { logout } from '@/lib/auth'

// 在任何地方调用
logout()
```

## 🔄 登录流程

1. 用户访问 `/login` 页面
2. 输入邮箱和密码
3. 点击"登录到实验环境"按钮
4. 前端发送 POST 请求到 `http://localhost:3001/auth/login`
5. 后端验证成功，返回 `{ access_token, user }`
6. 前端保存 Token 和用户信息到 localStorage
7. 跳转到 `/dashboard` 控制台

## 🔄 注册流程

1. 用户访问 `/register` 页面
2. 填写用户名、邮箱、密码等信息
3. 点击"创建账户"按钮
4. 前端验证密码一致性和长度
5. 发送 POST 请求到 `http://localhost:3001/auth/register`
6. 后端创建用户成功
7. 跳转到 `/login` 登录页

## 🔄 退出流程

1. 用户点击顶部导航栏的用户头像
2. 在下拉菜单中点击"退出登录"
3. 清除 localStorage 中的 Token 和用户信息
4. 跳转到 `/login` 登录页

## 🛡️ 安全特性

- ✅ Token 存储在 localStorage
- ✅ 受保护的路由自动检查认证状态
- ✅ 未登录用户无法访问受保护页面
- ✅ 登录状态持久化
- ✅ 退出登录清除所有认证信息
- ✅ 密码长度验证
- ✅ 密码确认验证

## 📝 API 接口

### 登录接口
```
POST http://localhost:3001/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "password123"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "student@example.com",
    "username": "张三",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 注册接口
```
POST http://localhost:3001/auth/register
Content-Type: application/json

{
  "username": "张三",
  "email": "student@example.com",
  "password": "password123"
}

Response:
{
  "id": 1,
  "email": "student@example.com",
  "username": "张三",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## 🎨 UI 特性

### 登录页面
- 玻璃态设计效果
- 网格背景图案
- 渐变光晕效果
- 加载状态动画
- 错误提示样式
- 系统状态栏

### 注册页面
- 与登录页面一致的设计风格
- 密码确认字段
- 学号可选字段
- 服务条款复选框
- 第三方注册按钮

### 用户菜单
- 圆形头像（显示首字母）
- 用户名和邮箱显示
- 快速导航链接
- 退出按钮（红色高亮）
- 点击外部自动关闭
- 平滑动画效果

## 🔍 调试技巧

### 查看当前登录状态
```javascript
// 在浏览器控制台执行
console.log('Token:', localStorage.getItem('token'))
console.log('User:', localStorage.getItem('user'))
```

### 手动清除登录状态
```javascript
// 在浏览器控制台执行
localStorage.removeItem('token')
localStorage.removeItem('user')
location.reload()
```

### 测试账号
如果后端已经运行并初始化数据库，可以使用以下测试账号：
- 邮箱: `test@example.com`
- 密码: `password123`

## ⚠️ 注意事项

1. **后端必须运行**: 确保后端服务在 `http://localhost:3001` 运行
2. **CORS 配置**: 后端需要允许前端域名的跨域请求
3. **Token 过期**: 当前实现未处理 Token 过期，需要后续添加刷新机制
4. **密码安全**: 生产环境需要使用 HTTPS 传输
5. **第三方登录**: GitHub/GitLab 登录按钮目前仅为 UI，需要后端支持

## 🚀 后续优化建议

- [ ] Token 自动刷新机制
- [ ] 记住我功能（7天免登录）
- [ ] 邮箱验证
- [ ] 找回密码功能
- [ ] 第三方登录集成（GitHub/GitLab OAuth）
- [ ] 登录日志记录
- [ ] 多设备登录管理
- [ ] 账号安全设置
- [ ] 两步验证（2FA）

---

**用户认证系统已完整实现！** 🎉

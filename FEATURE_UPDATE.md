# 功能更新说明

## 新增功能

### 1. 管理员用户管理功能

#### 后端更新
- **数据库模型** (`backend/prisma/schema.prisma`)
  - 在 `User` 模型中添加了 `qqNumber` 字段（可选）
  - 用于存储用户的QQ号，以便获取QQ头像

- **管理员API** (`backend/src/admin/`)
  - 新增 `POST /admin/users` - 创建用户接口
  - 更新 `GET /admin/users` - 返回用户列表时包含QQ号
  - 保留 `DELETE /admin/users/:id` - 删除用户接口

- **认证API** (`backend/src/auth/`)
  - 更新注册接口支持QQ号字段
  - 更新用户信息返回包含QQ号

#### 前端更新
- **管理员页面** (`frontend/src/app/admin/page.tsx`)
  - 添加"添加用户"按钮
  - 新增用户创建模态框，包含以下字段：
    - 用户名
    - 邮箱
    - 密码
    - QQ号（选填）
    - 角色（学生/教师/管理员）
  - 用户列表显示QQ头像
  - 保留删除用户功能（管理员账户不可删除）

- **注册页面** (`frontend/src/app/register/page.tsx`)
  - 添加QQ号输入字段（选填）
  - 用户注册时可以填写QQ号

### 2. QQ头像集成

#### API说明
使用腾讯QQ头像API：`http://q1.qlogo.cn/g?b=qq&nk={QQ号}&s={尺寸}`

尺寸选项：
- 1: 40x40
- 2: 40x40
- 3: 100x100
- 4: 140x140
- 5: 640x640

#### 工具函数 (`frontend/src/lib/avatar.ts`)
```typescript
// 获取QQ头像URL
getQQAvatar(qqNumber?: string, size?: number): string | null

// 获取用户头像（优先QQ头像）
getUserAvatar(user): string | null

// 获取头像或首字母
getUserAvatarOrInitial(user): { type: 'image' | 'initial'; value: string }
```

#### 组件更新
- **侧边栏** (`frontend/src/components/Sidebar.tsx`)
  - 集成QQ头像显示
  - 如果用户有QQ号，显示QQ头像
  - 否则显示用户名首字母

- **管理员页面**
  - 用户列表显示QQ头像
  - 没有QQ号的用户显示首字母头像

## 数据库迁移

已创建迁移文件：`backend/prisma/migrations/20260325163637_add_qq_number/`

运行迁移命令：
```bash
cd backend
npx prisma migrate dev
```

## API接口

### 创建用户
```
POST /admin/users
Content-Type: application/json
Authorization: Bearer {token}

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "role": "STUDENT",
  "qqNumber": "123456789"  // 可选
}
```

### 注册用户
```
POST /auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "new@example.com",
  "password": "password123",
  "qqNumber": "123456789"  // 可选
}
```

## 使用说明

### 管理员添加用户
1. 登录管理员账户
2. 进入"管理员控制台"
3. 点击"用户管理"标签
4. 点击"添加用户"按钮
5. 填写用户信息（QQ号可选）
6. 点击"创建"

### 用户注册
1. 访问注册页面
2. 填写用户名、邮箱、密码
3. 可选填写QQ号（用于获取QQ头像）
4. 点击"注册"

### QQ头像显示
- 如果用户填写了QQ号，系统会自动从QQ服务器获取头像
- 如果没有QQ号，显示用户名首字母作为默认头像
- 头像会在侧边栏和用户列表中显示

## 注意事项

1. QQ号字段为可选，不影响现有用户
2. 管理员账户不能被删除
3. QQ头像API使用HTTP协议，如果网站使用HTTPS可能需要配置
4. 建议在生产环境中考虑头像缓存策略

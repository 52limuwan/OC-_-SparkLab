# API 文档

## 基础信息

- Base URL: `http://localhost:4000`
- 认证方式: JWT Bearer Token
- 内容类型: `application/json`

## 认证接口

### 注册

```http
POST /auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

响应：

```json
{
  "id": "uuid",
  "username": "testuser",
  "email": "test@example.com",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### 登录

```http
POST /auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

响应：

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

### 获取用户信息

```http
GET /auth/profile
Authorization: Bearer <token>
```

响应：

```json
{
  "userId": "uuid",
  "username": "testuser"
}
```

## Docker 容器接口

### 创建容器

```http
POST /docker/container/create
Authorization: Bearer <token>
```

响应：

```json
{
  "containerId": "abc123...",
  "status": "created"
}
```

### 停止容器

```http
POST /docker/container/:id/stop
Authorization: Bearer <token>
```

响应：

```json
{
  "message": "Container stopped"
}
```

### 删除容器

```http
DELETE /docker/container/:id
Authorization: Bearer <token>
```

响应：

```json
{
  "message": "Container removed"
}
```

## 实验室接口

### 获取所有实验

```http
GET /labs
Authorization: Bearer <token>
```

响应：

```json
[
  {
    "id": "uuid",
    "title": "Linux 基础命令",
    "description": "学习 Linux 基础命令",
    "difficulty": "beginner",
    "timeLimit": 60,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### 获取单个实验

```http
GET /labs/:id
Authorization: Bearer <token>
```

响应：

```json
{
  "id": "uuid",
  "title": "Linux 基础命令",
  "description": "学习 Linux 基础命令",
  "content": "# 实验内容\n\n...",
  "difficulty": "beginner",
  "timeLimit": 60,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### 创建实验

```http
POST /labs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Docker 基础",
  "description": "学习 Docker 基础命令",
  "content": "# 实验目标\n\n...",
  "difficulty": "intermediate",
  "timeLimit": 90
}
```

## WebSocket 接口

### 终端连接

连接地址: `ws://localhost:4000/terminal`

#### 事件列表

##### 客户端 → 服务器

**start** - 启动终端会话

```javascript
socket.emit('start', {
  containerId: 'abc123...'
});
```

**input** - 发送用户输入

```javascript
socket.emit('input', 'ls -la\n');
```

**resize** - 调整终端大小

```javascript
socket.emit('resize', {
  rows: 30,
  cols: 100
});
```

##### 服务器 → 客户端

**ready** - 终端就绪

```javascript
socket.on('ready', () => {
  console.log('Terminal ready');
});
```

**output** - 终端输出

```javascript
socket.on('output', (data) => {
  terminal.write(data);
});
```

**error** - 错误信息

```javascript
socket.on('error', (error) => {
  console.error(error.message);
});
```

**exit** - 会话结束

```javascript
socket.on('exit', () => {
  console.log('Terminal session ended');
});
```

## 错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

## 错误响应格式

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## 使用示例

### JavaScript/TypeScript

```typescript
import axios from 'axios';
import { io } from 'socket.io-client';

// 登录
const { data } = await axios.post('http://localhost:4000/auth/login', {
  username: 'testuser',
  password: 'password123'
});

const token = data.access_token;

// 创建容器
const container = await axios.post(
  'http://localhost:4000/docker/container/create',
  {},
  {
    headers: { Authorization: `Bearer ${token}` }
  }
);

// 连接终端
const socket = io('http://localhost:4000/terminal');

socket.on('connect', () => {
  socket.emit('start', { containerId: container.data.containerId });
});

socket.on('output', (data) => {
  console.log(data);
});

socket.emit('input', 'echo "Hello World"\n');
```

### cURL

```bash
# 登录
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'

# 创建容器
curl -X POST http://localhost:4000/docker/container/create \
  -H "Authorization: Bearer <token>"

# 获取实验列表
curl http://localhost:4000/labs \
  -H "Authorization: Bearer <token>"
```

## 速率限制

- 登录接口: 5 次/分钟
- 容器创建: 10 次/小时
- 其他接口: 100 次/分钟

## 版本控制

当前版本: v1.0.0

API 版本通过 URL 路径管理：
- v1: `/api/v1/...`
- v2: `/api/v2/...`

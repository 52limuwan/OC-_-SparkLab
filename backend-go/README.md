# Spark Lab Go Backend

## 启动

1. 进入目录：`backend-go`
2. 复制环境变量：`.env.example` -> `.env`
3. 下载依赖：`go mod tidy`
4. 启动服务：`go run ./cmd/server`

默认端口：`3001`

## 已迁移接口（第一批）

- Auth
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/logout`
  - `GET /auth/profile`
  - `PUT /auth/profile`
  - `GET /auth/stats`
  - `GET /auth/check`
- Courses
  - `GET /courses`
  - `GET /courses/:id`
  - `POST /courses/:id/enroll`
  - `GET /courses/:id/progress`
- Labs
  - `GET /labs/:id`
  - `GET /labs/course/:courseId`
  - `POST /labs/:id/submit`

## 说明

当前版本直连 SQLite（`backend/prisma/spark_lab.db`），字段命名与 Prisma 现有表一致。后续将继续迁移 containers/snapshots/admin/server/ws。

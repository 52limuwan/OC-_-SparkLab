# Spark Lab Go Backend

## 启动

1. 进入目录：`backend-go`
2. 复制环境变量：`.env.example` -> `.env`
3. 下载依赖：`go mod tidy`
4. 启动服务：`go run ./cmd/server`

默认端口：`3001`

## 已迁移接口

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
- Containers
  - `POST /containers`
  - `GET /containers`
  - `GET /containers/:id`
  - `POST /containers/:id/start`
  - `POST /containers/:id/stop`
  - `DELETE /containers/:id`
  - `POST /containers/:id/heartbeat`
  - `POST /containers/:id/exec`
  - `POST /containers/:id/exec/create`
  - `POST /containers/:id/exec/start`
- Snapshots
  - `POST /snapshots`
  - `GET /snapshots`
  - `GET /snapshots/:id`
  - `POST /snapshots/:id/restore`
  - `DELETE /snapshots/:id`
- Admin
  - `GET /admin/stats`
  - `GET /admin/users`
  - `POST /admin/users`
  - `PUT /admin/users/:id`
  - `DELETE /admin/users/:id`
  - `POST /admin/courses`
  - `PUT /admin/courses/:id`
  - `DELETE /admin/courses/:id`
  - `POST /admin/labs`
  - `PUT /admin/labs/:id`
  - `DELETE /admin/labs/:id`
  - `GET /admin/containers`
  - `POST /admin/containers/:id/force-stop`
  - `GET /admin/servers/:serverId/available-port`
- Servers
  - `POST /servers`
  - `GET /servers`
  - `GET /servers/:id`
  - `PUT /servers/:id`
  - `DELETE /servers/:id`
  - `GET /servers/:id/containers`
  - `POST /servers/:id/containers/:containerId/start`
  - `POST /servers/:id/containers/:containerId/stop`
  - `DELETE /servers/:id/containers/:containerId`
  - `GET /servers/:id/images`
  - `POST /servers/:id/images/pull`
  - `POST /servers/:id/images/build`
  - `DELETE /servers/:id/images/:imageId`
- Agent (HTTP)
  - `GET /agent/install.sh`
  - `GET /agent/agent-http.py`
  - `GET /agent/agent.py`
  - `POST /agent/register`
  - `POST /agent/heartbeat`

## Agent 状态机制

- Agent 每次 `register/heartbeat` 会刷新 `servers.lastCheckAt` 并更新 `status=online`。
- 后端内置离线监控任务：若超过 `AGENT_OFFLINE_TIMEOUT` 未收到心跳，则自动标记为 `offline`。
- 检查间隔由 `AGENT_OFFLINE_CHECK_INTERVAL` 控制。

## 说明

当前版本直连 SQLite（`backend/prisma/spark_lab.db`），字段命名与 Prisma 现有表一致。

当前 `servers/images` 与部分远程容器能力仍有模拟响应，后续会继续替换为真实远程执行链路。

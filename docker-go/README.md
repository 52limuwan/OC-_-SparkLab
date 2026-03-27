# docker-go bridge

该目录提供一个轻量 HTTP 服务，用 **Go 官方 Docker SDK** 执行容器相关操作，供 `backend`（NestJS）通过 `DOCKER_GO_URL` 调用。

## 运行

要求：本机已安装 Go（建议 1.22+），并且 Docker 引擎可用（本机或通过 `DOCKER_HOST` 指向远程 Docker）。

```bash
set DOCKER_GO_ADDR=127.0.0.1:8085
go run .
```

健康检查：`GET /health`


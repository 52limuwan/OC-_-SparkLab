package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
	"github.com/docker/go-connections/nat"
)

type PortMapping struct {
	ContainerPort int    `json:"containerPort"`
	HostPort      *int   `json:"hostPort,omitempty"`
	Protocol      string `json:"protocol"` // tcp|udp
	Random        bool   `json:"random"`
}

type EnvironmentVar struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type VolumeMount struct {
	HostPath      string `json:"hostPath"`
	ContainerPath string `json:"containerPath"`
	Mode          string `json:"mode"` // ro|rw
}

type CreateContainerOptions struct {
	Image          string          `json:"image"`
	Name           string          `json:"name"`
	CpuLimit       float64         `json:"cpuLimit"`
	MemoryLimit    int64           `json:"memoryLimit"` // MB
	PortMappings   []PortMapping   `json:"portMappings,omitempty"`
	EnvironmentVars []EnvironmentVar `json:"environmentVars,omitempty"`
	VolumeMounts   []VolumeMount   `json:"volumeMounts,omitempty"`
	RestartPolicy  string          `json:"restartPolicy,omitempty"` // no|always|unless-stopped|on-failure
}

type CreateContainerResult struct {
	ID           string `json:"id"`
	PortMappings []struct {
		ContainerPort int    `json:"containerPort"`
		HostPort      int    `json:"hostPort"`
		Protocol      string `json:"protocol"`
	} `json:"portMappings"`
}

type ExecCommandRequest struct {
	Command string `json:"command"`
}

type ExecCreateRequest struct {
	Command string         `json:"command"`
	Options map[string]any `json:"options,omitempty"`
}

type ExecCreateResponse struct {
	ExecID string `json:"execId"`
}

type ExecStartRequest struct {
	Stream bool `json:"stream,omitempty"`
}

type ExecStartResponse struct {
	Streaming bool   `json:"streaming,omitempty"`
	Output    string `json:"output,omitempty"`
}

type CommitRequest struct {
	ImageName string `json:"imageName"`
}

type CommitResponse struct {
	ImageID string `json:"imageId"`
}

type CreateFromSnapshotRequest struct {
	ImageID string `json:"imageId"`
	Name    string `json:"name"`
}

type CreateFromSnapshotResponse struct {
	ID string `json:"id"`
}

type server struct {
	docker *client.Client
}

func main() {
	addr := envString("DOCKER_GO_ADDR", "127.0.0.1:8085")

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		log.Fatalf("create docker client: %v", err)
	}

	s := &server{docker: cli}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", s.handleHealth)
	mux.HandleFunc("POST /containers", s.handleCreateContainer)
	mux.HandleFunc("POST /containers/{id}/start", s.handleStartContainer)
	mux.HandleFunc("POST /containers/{id}/stop", s.handleStopContainer)
	mux.HandleFunc("DELETE /containers/{id}", s.handleRemoveContainer)
	mux.HandleFunc("POST /containers/{id}/exec", s.handleExecCommand)
	mux.HandleFunc("POST /containers/{id}/exec/create", s.handleExecCreate)
	mux.HandleFunc("POST /exec/{execId}/start", s.handleExecStart)
	mux.HandleFunc("POST /containers/{id}/commit", s.handleCommitContainer)
	mux.HandleFunc("POST /containers/from-snapshot", s.handleCreateFromSnapshot)

	h := withJSON(withRecovery(withLogging(mux)))

	log.Printf("docker-go listening on %s", addr)
	if err := http.ListenAndServe(addr, h); err != nil {
		log.Fatalf("listen: %v", err)
	}
}

func (s *server) handleHealth(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()
	_, err := s.docker.Ping(ctx)
	if err != nil {
		writeError(w, http.StatusServiceUnavailable, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func (s *server) handleCreateContainer(w http.ResponseWriter, r *http.Request) {
	var opts CreateContainerOptions
	if err := readJSON(r, &opts); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	if strings.TrimSpace(opts.Image) == "" || strings.TrimSpace(opts.Name) == "" {
		writeError(w, http.StatusBadRequest, errors.New("image and name are required"))
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Minute)
	defer cancel()

	if err := s.ensureImage(ctx, opts.Image); err != nil {
		writeError(w, http.StatusBadRequest, fmt.Errorf("pull image: %w", err))
		return
	}

	exposed := nat.PortSet{}
	bindings := nat.PortMap{}
	for _, pm := range opts.PortMappings {
		proto := pm.Protocol
		if proto == "" {
			proto = "tcp"
		}
		p := nat.Port(fmt.Sprintf("%d/%s", pm.ContainerPort, proto))
		exposed[p] = struct{}{}
		if pm.Random {
			bindings[p] = []nat.PortBinding{{HostIP: "", HostPort: ""}}
		} else if pm.HostPort != nil {
			bindings[p] = []nat.PortBinding{{HostIP: "", HostPort: strconv.Itoa(*pm.HostPort)}}
		}
	}

	var env []string
	for _, e := range opts.EnvironmentVars {
		env = append(env, fmt.Sprintf("%s=%s", e.Name, e.Value))
	}

	var binds []string
	for _, v := range opts.VolumeMounts {
		mode := v.Mode
		if mode == "" {
			mode = "rw"
		}
		binds = append(binds, fmt.Sprintf("%s:%s:%s", v.HostPath, v.ContainerPath, mode))
	}

	rp := strings.TrimSpace(opts.RestartPolicy)
	if rp == "" {
		rp = "unless-stopped"
	}

	cfg := &container.Config{
		Image:        opts.Image,
		Tty:          true,
		OpenStdin:    true,
		ExposedPorts: exposed,
		Env:          env,
	}
	hostCfg := &container.HostConfig{
		Binds: binds,
		Resources: container.Resources{
			Memory:   opts.MemoryLimit * 1024 * 1024,
			NanoCPUs: int64(opts.CpuLimit * 1_000_000_000),
		},
		PortBindings: bindings,
		AutoRemove:   false,
		RestartPolicy: container.RestartPolicy{
			Name: rp,
		},
	}

	created, err := s.docker.ContainerCreate(ctx, cfg, hostCfg, &network.NetworkingConfig{}, nil, opts.Name)
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}

	if err := s.docker.ContainerStart(ctx, created.ID, container.StartOptions{}); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}

	inspect, err := s.docker.ContainerInspect(ctx, created.ID)
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}

	var actual []struct {
		ContainerPort int    `json:"containerPort"`
		HostPort      int    `json:"hostPort"`
		Protocol      string `json:"protocol"`
	}
	for _, pm := range opts.PortMappings {
		proto := pm.Protocol
		if proto == "" {
			proto = "tcp"
		}
		key := nat.Port(fmt.Sprintf("%d/%s", pm.ContainerPort, proto))
		if pb := inspect.NetworkSettings.Ports[key]; len(pb) > 0 {
			hp, _ := strconv.Atoi(pb[0].HostPort)
			if hp > 0 {
				actual = append(actual, struct {
					ContainerPort int    `json:"containerPort"`
					HostPort      int    `json:"hostPort"`
					Protocol      string `json:"protocol"`
				}{ContainerPort: pm.ContainerPort, HostPort: hp, Protocol: proto})
			}
		}
	}

	writeJSON(w, http.StatusOK, CreateContainerResult{ID: created.ID, PortMappings: actual})
}

func (s *server) handleStartContainer(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Minute)
	defer cancel()
	if err := s.docker.ContainerStart(ctx, id, container.StartOptions{}); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func (s *server) handleStopContainer(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Minute)
	defer cancel()
	timeoutSec := 10
	if err := s.docker.ContainerStop(ctx, id, container.StopOptions{Timeout: &timeoutSec}); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func (s *server) handleRemoveContainer(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Minute)
	defer cancel()
	if err := s.docker.ContainerRemove(ctx, id, container.RemoveOptions{Force: true, RemoveVolumes: true}); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func (s *server) handleExecCommand(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req ExecCommandRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Minute)
	defer cancel()

	execResp, err := s.docker.ContainerExecCreate(ctx, id, container.ExecOptions{
		Cmd:          []string{"/bin/sh", "-c", req.Command},
		AttachStdout: true,
		AttachStderr: true,
		Tty:          false,
	})
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}

	attach, err := s.docker.ContainerExecAttach(ctx, execResp.ID, container.ExecAttachOptions{
		Tty:   false,
		Detach: false,
	})
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	defer attach.Close()

	out, err := readExecOutput(attach.Reader)
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"output": out})
}

func (s *server) handleExecCreate(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req ExecCreateRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	cmd := strings.Fields(req.Command)
	if len(cmd) == 0 {
		writeError(w, http.StatusBadRequest, errors.New("command is required"))
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Minute)
	defer cancel()

	execResp, err := s.docker.ContainerExecCreate(ctx, id, container.ExecOptions{
		Cmd:          cmd,
		AttachStdin:  true,
		AttachStdout: true,
		AttachStderr: true,
		Tty:          true,
	})
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusOK, ExecCreateResponse{ExecID: execResp.ID})
}

func (s *server) handleExecStart(w http.ResponseWriter, r *http.Request) {
	execID := r.PathValue("execId")
	var req ExecStartRequest
	_ = readJSON(r, &req)
	if req.Stream {
		writeJSON(w, http.StatusOK, ExecStartResponse{Streaming: true})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Minute)
	defer cancel()

	attach, err := s.docker.ContainerExecAttach(ctx, execID, container.ExecAttachOptions{
		Tty: true,
	})
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	defer attach.Close()

	b, err := io.ReadAll(attach.Reader)
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusOK, ExecStartResponse{Output: string(b)})
}

func (s *server) handleCommitContainer(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req CommitRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	if strings.TrimSpace(req.ImageName) == "" {
		writeError(w, http.StatusBadRequest, errors.New("imageName is required"))
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Minute)
	defer cancel()

	resp, err := s.docker.ContainerCommit(ctx, id, container.CommitOptions{
		Reference: fmt.Sprintf("%s:latest", req.ImageName),
	})
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusOK, CommitResponse{ImageID: resp.ID})
}

func (s *server) handleCreateFromSnapshot(w http.ResponseWriter, r *http.Request) {
	var req CreateFromSnapshotRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Minute)
	defer cancel()

	created, err := s.docker.ContainerCreate(ctx, &container.Config{
		Image:     req.ImageID,
		Tty:       true,
		OpenStdin: true,
	}, &container.HostConfig{
		PublishAllPorts: true,
	}, &network.NetworkingConfig{}, nil, req.Name)
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	if err := s.docker.ContainerStart(ctx, created.ID, container.StartOptions{}); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusOK, CreateFromSnapshotResponse{ID: created.ID})
}

func (s *server) ensureImage(ctx context.Context, imageRef string) error {
	_, _, err := s.docker.ImageInspectWithRaw(ctx, imageRef)
	if err == nil {
		return nil
	}
	reader, err := s.docker.ImagePull(ctx, imageRef, image.PullOptions{})
	if err != nil {
		return err
	}
	defer reader.Close()
	_, _ = io.Copy(io.Discard, reader)
	return nil
}

func readExecOutput(r io.Reader) (string, error) {
	var stdout, stderr strings.Builder
	_, err := stdcopy.StdCopy(&stdout, &stderr, r)
	if err != nil {
		// Some images/tools may output raw stream; fall back.
		b, readErr := io.ReadAll(io.MultiReader(strings.NewReader(stdout.String()), r))
		if readErr == nil && len(b) > 0 {
			return string(b), nil
		}
		return "", err
	}
	return stdout.String() + stderr.String(), nil
}

func readJSON(r *http.Request, v any) error {
	if r.Body == nil {
		return errors.New("missing body")
	}
	defer r.Body.Close()
	b, err := io.ReadAll(io.LimitReader(r.Body, 2<<20))
	if err != nil {
		return err
	}
	if len(bytesTrimSpace(b)) == 0 {
		return errors.New("empty body")
	}
	return json.Unmarshal(b, v)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, err error) {
	writeJSON(w, status, map[string]any{
		"error": err.Error(),
	})
}

func withLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start).Truncate(time.Millisecond))
	})
}

func withRecovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				writeError(w, http.StatusInternalServerError, fmt.Errorf("panic: %v", rec))
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func withJSON(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func envString(key, def string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return def
}

func bytesTrimSpace(b []byte) []byte {
	return []byte(strings.TrimSpace(string(b)))
}


package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os/exec"
	"runtime"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/api/types/mount"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
	"github.com/docker/go-connections/nat"
)

// LogLine represents a single log line with timestamp
type LogLine struct {
	Timestamp time.Time
	Content   string
}

// DockerService manages Docker containers for MCP servers
type DockerService struct {
	client *client.Client
}

// ContainerInfo represents detailed information about a Docker container
type ContainerInfo struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	DisplayName string            `json:"display_name"`
	Image       string            `json:"image"`
	Status      string            `json:"status"`
	State       string            `json:"state"`
	Uptime      string            `json:"uptime"`
	CPU         string            `json:"cpu"`
	Memory      string            `json:"memory"`
	Port        int               `json:"port"`
	Version     string            `json:"version"`
	Environment map[string]string `json:"environment"`
	Volumes     []string          `json:"volumes"`
	CreatedAt   time.Time         `json:"created_at"`
	StartedAt   time.Time         `json:"started_at"`
	Labels      map[string]string `json:"labels"`
}

// NewDockerService creates a new Docker service instance
func NewDockerService() (*DockerService, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, fmt.Errorf("failed to create Docker client: %w", err)
	}

	return &DockerService{client: cli}, nil
}

// GetManagedContainers returns all containers managed by neobelt
func (ds *DockerService) GetManagedContainers(ctx context.Context) ([]ContainerInfo, error) {
	filterArgs := filters.NewArgs()
	filterArgs.Add("label", "neobelt.managed-by=true")

	containers, err := ds.client.ContainerList(ctx, container.ListOptions{
		All:     true,
		Filters: filterArgs,
	})
	if err != nil {
		LogError("Failed to list containers: %v", err)
		return nil, fmt.Errorf("failed to list containers: %w", err)
	}

	var containerInfos []ContainerInfo
	for _, cont := range containers {
		info, err := ds.getContainerInfo(ctx, cont.ID)
		if err != nil {
			LogWarning("Failed to get info for container %s: %v", cont.ID, err)
			continue
		}
		containerInfos = append(containerInfos, *info)
	}

	return containerInfos, nil
}

// getContainerInfo retrieves detailed information about a specific container
func (ds *DockerService) getContainerInfo(ctx context.Context, containerID string) (*ContainerInfo, error) {
	inspect, err := ds.client.ContainerInspect(ctx, containerID)
	if err != nil {
		return nil, fmt.Errorf("failed to inspect container: %w", err)
	}

	// Parse environment variables
	envMap := make(map[string]string)
	for _, env := range inspect.Config.Env {
		parts := strings.SplitN(env, "=", 2)
		if len(parts) == 2 {
			envMap[parts[0]] = parts[1]
		}
	}

	// Parse volumes
	var volumes []string
	for _, mount := range inspect.Mounts {
		volumes = append(volumes, fmt.Sprintf("%s:%s", mount.Source, mount.Destination))
	}

	// Calculate uptime
	var uptime string
	if inspect.State.Running {
		startTime, _ := time.Parse(time.RFC3339Nano, inspect.State.StartedAt)
		uptime = formatUptime(time.Since(startTime))
	} else {
		uptime = "0h"
	}

	// Get host port mapping (what users connect to)
	port := 0
	if len(inspect.NetworkSettings.Ports) > 0 {
		for containerPort, bindings := range inspect.NetworkSettings.Ports {
			if strings.Contains(string(containerPort), "tcp") && len(bindings) > 0 {
				// Get the host port from the first binding
				hostPortStr := bindings[0].HostPort
				if hostPortStr != "" {
					if hostPort, err := strconv.Atoi(hostPortStr); err == nil {
						port = hostPort
						break
					}
				}
			}
		}
	}

	// Parse creation and start times
	createdAt, _ := time.Parse(time.RFC3339Nano, inspect.Created)
	startedAt, _ := time.Parse(time.RFC3339Nano, inspect.State.StartedAt)

	// Get real-time CPU and memory stats for running containers
	cpu := "0%"
	memory := "0MB"
	if inspect.State.Running {
		if cpuStat, memoryStat, err := ds.GetContainerStats(ctx, containerID); err == nil {
			cpu = cpuStat
			memory = memoryStat
		}
	}

	return &ContainerInfo{
		ID:          inspect.ID[:12], // Short ID
		Name:        strings.TrimPrefix(inspect.Name, "/"),
		Image:       inspect.Config.Image,
		Status:      inspect.State.Status,
		State:       ds.mapContainerState(inspect.State.Status),
		Uptime:      uptime,
		CPU:         cpu,
		Memory:      memory,
		Port:        port,
		Version:     "", // Will be populated by App.GetManagedContainers
		Environment: envMap,
		Volumes:     volumes,
		CreatedAt:   createdAt,
		StartedAt:   startedAt,
		Labels:      inspect.Config.Labels,
	}, nil
}

// mapContainerState maps Docker container status to neobelt states
func (ds *DockerService) mapContainerState(status string) string {
	switch status {
	case "running":
		return "running"
	case "exited", "dead":
		return "stopped"
	case "restarting":
		return "restarting"
	default:
		return "error"
	}
}

// formatUptime formats a duration into a human-readable uptime string
func formatUptime(d time.Duration) string {
	days := int(d.Hours()) / 24
	hours := int(d.Hours()) % 24
	minutes := int(d.Minutes()) % 60

	if days > 0 {
		return fmt.Sprintf("%dd %dh %dm", days, hours, minutes)
	} else if hours > 0 {
		return fmt.Sprintf("%dh %dm", hours, minutes)
	} else {
		return fmt.Sprintf("%dm", minutes)
	}
}

// StartContainer starts a stopped container
func (ds *DockerService) StartContainer(ctx context.Context, containerID string) error {
	LogDebug("Starting container: %s", containerID)

	// First check if container exists
	inspect, err := ds.client.ContainerInspect(ctx, containerID)
	if err != nil {
		LogError("Container %s not found before start: %v", containerID, err)
		return fmt.Errorf("container not found: %w", err)
	}

	LogDebug("Container %s exists, current state: %s", containerID, inspect.State.Status)

	err = ds.client.ContainerStart(ctx, containerID, container.StartOptions{})
	if err != nil {
		LogError("Failed to start container %s: %v", containerID, err)
		return err
	}

	LogDebug("Container start command completed for %s", containerID)

	// Verify the container started successfully
	inspect, err = ds.client.ContainerInspect(ctx, containerID)
	if err != nil {
		LogError("Failed to inspect container %s after start: %v", containerID, err)
	} else {
		LogDebug("Container %s post-start state: %s", containerID, inspect.State.Status)
	}

	return nil
}

// StopContainer stops a running container
func (ds *DockerService) StopContainer(ctx context.Context, containerID string) error {
	timeout := 30 // seconds
	return ds.client.ContainerStop(ctx, containerID, container.StopOptions{
		Timeout: &timeout,
	})
}

// RestartContainer restarts a container
func (ds *DockerService) RestartContainer(ctx context.Context, containerID string) error {
	timeout := 30 // seconds
	return ds.client.ContainerRestart(ctx, containerID, container.StopOptions{
		Timeout: &timeout,
	})
}

// RemoveContainer removes a container (must be stopped first)
func (ds *DockerService) RemoveContainer(ctx context.Context, containerID string, force bool) error {
	return ds.client.ContainerRemove(ctx, containerID, container.RemoveOptions{
		Force: force,
	})
}

// GetContainerLogs retrieves logs from a container
func (ds *DockerService) GetContainerLogs(ctx context.Context, containerID string, lines int) (string, error) {
	options := container.LogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Tail:       fmt.Sprintf("%d", lines),
		Timestamps: true,
	}

	logs, err := ds.client.ContainerLogs(ctx, containerID, options)
	if err != nil {
		return "", fmt.Errorf("failed to get container logs: %w", err)
	}
	defer logs.Close()

	// Use stdcopy to properly parse Docker log stream and remove header bytes
	var stdout, stderr bytes.Buffer
	_, err = stdcopy.StdCopy(&stdout, &stderr, logs)
	if err != nil {
		return "", fmt.Errorf("failed to parse logs: %w", err)
	}

	// Parse log lines with timestamps from both streams
	var allLogLines []LogLine

	// Parse stdout lines
	stdoutLines := strings.Split(strings.TrimSpace(stdout.String()), "\n")
	for _, line := range stdoutLines {
		if line != "" {
			if logLine := parseLogLine(line); logLine != nil {
				allLogLines = append(allLogLines, *logLine)
			}
		}
	}

	// Parse stderr lines
	stderrLines := strings.Split(strings.TrimSpace(stderr.String()), "\n")
	for _, line := range stderrLines {
		if line != "" {
			if logLine := parseLogLine(line); logLine != nil {
				allLogLines = append(allLogLines, *logLine)
			}
		}
	}

	// Sort by timestamp
	sort.Slice(allLogLines, func(i, j int) bool {
		return allLogLines[i].Timestamp.Before(allLogLines[j].Timestamp)
	})

	// Combine sorted lines
	var result strings.Builder
	for i, logLine := range allLogLines {
		if i > 0 {
			result.WriteString("\n")
		}
		result.WriteString(fmt.Sprintf("[%s] ", logLine.Timestamp.Format(time.RFC3339)))
		result.WriteString(logLine.Content)
	}

	return result.String(), nil
}

// parseLogLine parses a Docker log line with timestamp format: "2025-08-04T10:51:11.710356759Z message"
func parseLogLine(line string) *LogLine {
	if len(line) < 30 { // Minimum length for timestamp + space + content
		return &LogLine{Timestamp: time.Time{}, Content: line}
	}

	// Find the space after the timestamp
	spaceIndex := strings.Index(line, " ")
	if spaceIndex == -1 || spaceIndex < 20 { // RFC3339Nano is at least 20 chars
		return &LogLine{Timestamp: time.Time{}, Content: line}
	}

	timestampStr := line[:spaceIndex]
	content := line[spaceIndex+1:]

	// Parse the timestamp
	timestamp, err := time.Parse(time.RFC3339Nano, timestampStr)
	if err != nil {
		// If parsing fails, use zero time and return original line
		return &LogLine{Timestamp: time.Time{}, Content: line}
	}

	return &LogLine{
		Timestamp: timestamp,
		Content:   content,
	}
}

// PullImage pulls a Docker image
func (ds *DockerService) PullImage(ctx context.Context, imageName string) error {
	reader, err := ds.client.ImagePull(ctx, imageName, image.PullOptions{})
	if err != nil {
		return fmt.Errorf("failed to pull image: %w", err)
	}
	defer reader.Close()

	// Read the pull progress (you can process this for progress indication)
	_, err = io.ReadAll(reader)
	if err != nil {
		return fmt.Errorf("failed to read pull progress: %w", err)
	}

	return nil
}

// CreateContainer creates a new container with neobelt labels
func (ds *DockerService) CreateContainer(ctx context.Context, config ContainerCreateConfig) (string, error) {
	LogDebug("CreateContainer called with config: %+v", config)

	// Add neobelt management labels
	if config.Labels == nil {
		config.Labels = make(map[string]string)
	}
	config.Labels["neobelt.managed-by"] = "true"
	config.Labels["neobelt.created-at"] = time.Now().Format(time.RFC3339)

	LogDebug("Container labels set: %+v", config.Labels)

	// Convert environment map to slice
	var env []string
	for key, value := range config.Environment {
		env = append(env, fmt.Sprintf("%s=%s", key, value))
	}
	LogDebug("Environment variables: %v", env)

	// Convert volume map to mounts
	var mounts []mount.Mount
	for hostPath, containerPath := range config.Volumes {
		mounts = append(mounts, mount.Mount{
			Type:   mount.TypeBind,
			Source: hostPath,
			Target: containerPath,
		})
	}
	LogDebug("Volume mounts: %+v", mounts)

	// Parse docker command if provided
	var cmd []string
	if config.DockerCommand != "" {
		cmd = parseDockerCommand(config.DockerCommand)
		LogDebug("Setting container CMD to: %v", cmd)
	}

	// Create container configuration
	containerConfig := &container.Config{
		Image:  config.Image,
		Env:    env,
		Labels: config.Labels,
		Cmd:    cmd,
	}

	// Create host configuration
	hostConfig := &container.HostConfig{
		Mounts:      mounts,
		AutoRemove:  false,
		NetworkMode: "bridge",
	}

	// Set memory limit if specified
	if config.MemoryLimitMB > 0 {
		hostConfig.Memory = int64(config.MemoryLimitMB) * 1024 * 1024 // Convert MB to bytes
		LogDebug("Memory limit set to: %d MB (%d bytes)", config.MemoryLimitMB, hostConfig.Memory)
	}

	// Set restart policy if specified
	if config.RestartPolicy != "" {
		hostConfig.RestartPolicy = container.RestartPolicy{
			Name: container.RestartPolicyMode(config.RestartPolicy),
		}
		LogDebug("Restart policy set to: %s", config.RestartPolicy)
	}

	// Add port mapping if specified
	if config.Port > 0 {
		// Use container port from MCP registry, fallback to host port if not specified
		containerPortNum := config.ContainerPort
		if containerPortNum == 0 {
			containerPortNum = config.Port // Fallback for backward compatibility
		}

		containerPort, _ := nat.NewPort("tcp", strconv.Itoa(containerPortNum))

		hostConfig.PortBindings = nat.PortMap{
			containerPort: []nat.PortBinding{
				{HostIP: "127.0.0.1", HostPort: strconv.Itoa(config.Port)},
			},
		}
		containerConfig.ExposedPorts = nat.PortSet{
			containerPort: struct{}{},
		}
		LogDebug("Port mapping configured: host %d -> container %d", config.Port, containerPortNum)
	}

	LogDebug("Creating container with name: %s, image: %s", config.Name, config.Image)
	resp, err := ds.client.ContainerCreate(ctx, containerConfig, hostConfig, nil, nil, config.Name)
	if err != nil {
		LogError("Failed to create container: %v", err)
		return "", fmt.Errorf("failed to create container: %w", err)
	}

	LogDebug("Container created successfully with ID: %s", resp.ID)

	// Immediately verify the container was created and has correct labels
	inspect, err := ds.client.ContainerInspect(ctx, resp.ID)
	if err != nil {
		LogError("Failed to inspect newly created container %s: %v", resp.ID, err)
	} else {
		LogDebug("Container %s inspect successful - Labels: %+v", resp.ID, inspect.Config.Labels)
		if managedBy, exists := inspect.Config.Labels["neobelt.managed-by"]; exists {
			LogDebug("Container %s has neobelt.managed-by label: %s", resp.ID, managedBy)
		} else {
			LogWarning("Container %s is missing neobelt.managed-by label!", resp.ID)
		}
	}

	return resp.ID, nil
}

// RemoveImage removes a Docker image
func (ds *DockerService) RemoveImage(ctx context.Context, imageID string, force bool) error {
	_, err := ds.client.ImageRemove(ctx, imageID, image.RemoveOptions{
		Force: force,
	})
	return err
}

// ListImages returns all Docker images
func (ds *DockerService) ListImages(ctx context.Context) ([]image.Summary, error) {
	return ds.client.ImageList(ctx, image.ListOptions{})
}

// ContainerCreateConfig holds configuration for creating a new container
type ContainerCreateConfig struct {
	Name          string            `json:"name"`
	Image         string            `json:"image"`
	Port          int               `json:"port"`           // Host port (external)
	ContainerPort int               `json:"container_port"` // Container port (internal, from MCP registry)
	Environment   map[string]string `json:"environment"`
	Volumes       map[string]string `json:"volumes"` // host_path -> container_path
	Labels        map[string]string `json:"labels"`
	DockerCommand string            `json:"docker_command"`  // Command arguments from registry
	MemoryLimitMB int               `json:"memory_limit_mb"` // Memory limit in MB
	RestartPolicy string            `json:"restart_policy"`  // Docker restart policy (no, always, on-failure, unless-stopped)
}

// GetContainerStats gets real-time stats for a container
func (ds *DockerService) GetContainerStats(ctx context.Context, containerID string) (string, string, error) {
	stats, err := ds.client.ContainerStats(ctx, containerID, false)
	if err != nil {
		return "0%", "0MB", fmt.Errorf("failed to get container stats: %w", err)
	}
	defer stats.Body.Close()

	// Read and parse the stats JSON
	statsData, err := io.ReadAll(stats.Body)
	if err != nil {
		return "0%", "0MB", fmt.Errorf("failed to read stats: %w", err)
	}

	return parseContainerStats(statsData)
}

// parseContainerStats parses Docker stats JSON and returns CPU and memory usage
func parseContainerStats(statsData []byte) (string, string, error) {
	var stats struct {
		CPUStats struct {
			CPUUsage struct {
				TotalUsage uint64 `json:"total_usage"`
			} `json:"cpu_usage"`
			SystemCPUUsage uint64 `json:"system_cpu_usage"`
		} `json:"cpu_stats"`
		PreCPUStats struct {
			CPUUsage struct {
				TotalUsage uint64 `json:"total_usage"`
			} `json:"cpu_usage"`
			SystemCPUUsage uint64 `json:"system_cpu_usage"`
		} `json:"precpu_stats"`
		MemoryStats struct {
			Usage uint64 `json:"usage"`
			Limit uint64 `json:"limit"`
		} `json:"memory_stats"`
	}

	err := json.Unmarshal(statsData, &stats)
	if err != nil {
		return "0%", "0MB", fmt.Errorf("failed to parse stats JSON: %w", err)
	}

	// Calculate CPU percentage
	cpuPercent := 0.0
	cpuDelta := float64(stats.CPUStats.CPUUsage.TotalUsage - stats.PreCPUStats.CPUUsage.TotalUsage)
	systemDelta := float64(stats.CPUStats.SystemCPUUsage - stats.PreCPUStats.SystemCPUUsage)

	if systemDelta > 0 && cpuDelta > 0 {
		cpuPercent = (cpuDelta / systemDelta) * 100.0
	}

	// Format memory usage in MB
	memoryMB := float64(stats.MemoryStats.Usage) / (1024 * 1024)

	return fmt.Sprintf("%.1f%%", cpuPercent), fmt.Sprintf("%.0fMB", memoryMB), nil
}

// parseDockerCommand parses docker command arguments into a slice for CMD
func parseDockerCommand(dockerCommand string) []string {
	if dockerCommand == "" {
		return nil
	}

	LogDebug("Using docker command as CMD: %s", dockerCommand)

	// Simple argument parsing - split by spaces, respecting quoted strings
	return parseCommandArgs(dockerCommand)
}

// parseCommandArgs parses command line arguments, respecting quoted strings
func parseCommandArgs(cmd string) []string {
	var args []string
	var current strings.Builder
	inQuotes := false
	quoteChar := byte(0)

	for i := 0; i < len(cmd); i++ {
		c := cmd[i]

		if !inQuotes && (c == '"' || c == '\'') {
			inQuotes = true
			quoteChar = c
		} else if inQuotes && c == quoteChar {
			inQuotes = false
			quoteChar = 0
		} else if !inQuotes && c == ' ' {
			if current.Len() > 0 {
				args = append(args, current.String())
				current.Reset()
			}
		} else {
			current.WriteByte(c)
		}
	}

	if current.Len() > 0 {
		args = append(args, current.String())
	}

	return args
}

// GetOrphanedManagedContainers returns containers managed by neobelt but not in the provided configured servers list
func (ds *DockerService) GetOrphanedManagedContainers(ctx context.Context, configuredServers []ConfiguredServer) ([]ContainerInfo, error) {
	// Get all managed containers
	allManagedContainers, err := ds.GetManagedContainers(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get managed containers: %w", err)
	}

	// Create a map of configured container IDs for quick lookup
	configuredMap := make(map[string]bool)
	for _, configuredServer := range configuredServers {
		if configuredServer.ContainerID != "" {
			// Handle both short and full container IDs
			configuredMap[configuredServer.ContainerID] = true
		}
	}

	// Find containers that are managed by neobelt but not in configuration
	var orphaned []ContainerInfo
	for _, container := range allManagedContainers {
		isConfigured := false

		// Check if this container is in our configured servers
		for configuredContainerID := range configuredMap {
			if container.ID == configuredContainerID ||
				(len(configuredContainerID) > len(container.ID) && strings.HasPrefix(configuredContainerID, container.ID)) ||
				(len(container.ID) > len(configuredContainerID) && strings.HasPrefix(container.ID, configuredContainerID)) {
				isConfigured = true
				break
			}
		}

		if !isConfigured {
			orphaned = append(orphaned, container)
		}
	}

	return orphaned, nil
}

// CleanupOrphanedContainers stops and removes orphaned neobelt containers
func (ds *DockerService) CleanupOrphanedContainers(ctx context.Context, configuredServers []ConfiguredServer) error {
	orphaned, err := ds.GetOrphanedManagedContainers(ctx, configuredServers)
	if err != nil {
		return fmt.Errorf("failed to get orphaned containers: %w", err)
	}

	if len(orphaned) == 0 {
		return nil
	}

	LogInfo("Found %d orphaned neobelt containers, cleaning up...", len(orphaned))

	for _, container := range orphaned {
		LogInfo("Cleaning up orphaned container: %s (%s)", container.ID, container.Name)

		// Stop the container if it's running
		if container.State == "running" {
			LogInfo("Stopping running orphaned container: %s", container.ID)
			if err := ds.StopContainer(ctx, container.ID); err != nil {
				LogWarning("Failed to stop orphaned container %s: %v", container.ID, err)
				// Continue with removal even if stop fails
			}
		}

		// Remove the container
		LogInfo("Removing orphaned container: %s", container.ID)
		if err := ds.RemoveContainer(ctx, container.ID, true); err != nil {
			LogError("Failed to remove orphaned container %s: %v", container.ID, err)
		} else {
			LogInfo("Successfully removed orphaned container: %s", container.ID)
		}
	}

	return nil
}

// DockerStatus represents the current status of Docker
type DockerStatus struct {
	IsRunning             bool `json:"is_running"`
	IsDockerDesktopInstalled bool `json:"is_docker_desktop_installed"`
}

// CheckDockerStatus checks if Docker daemon is running
func (ds *DockerService) CheckDockerStatus(ctx context.Context) *DockerStatus {
	status := &DockerStatus{
		IsRunning:             false,
		IsDockerDesktopInstalled: ds.IsDockerDesktopInstalled(),
	}
	
	// Try to ping Docker daemon
	if ds.client != nil {
		_, err := ds.client.Ping(ctx)
		status.IsRunning = err == nil
	}
	
	return status
}

// IsDockerDesktopInstalled checks if Docker Desktop is installed on the system
func (ds *DockerService) IsDockerDesktopInstalled() bool {
	switch runtime.GOOS {
	case "windows":
		// Check if Docker Desktop executable exists
		cmd := exec.Command("where", "Docker Desktop.exe")
		err := cmd.Run()
		return err == nil
	case "darwin":
		// Check if Docker Desktop app exists
		cmd := exec.Command("test", "-d", "/Applications/Docker.app")
		err := cmd.Run()
		return err == nil
	case "linux":
		// On Linux, check for docker-desktop or docker-ce
		cmd := exec.Command("which", "docker")
		err := cmd.Run()
		return err == nil
	default:
		return false
	}
}

// StartDockerDesktop attempts to start Docker Desktop
func (ds *DockerService) StartDockerDesktop() error {
	switch runtime.GOOS {
	case "windows":
		cmd := exec.Command("cmd", "/c", "start", "", "Docker Desktop")
		return cmd.Start()
	case "darwin":
		cmd := exec.Command("open", "-a", "Docker")
		return cmd.Start()
	case "linux":
		// On Linux, systemctl might be used to start docker service
		cmd := exec.Command("systemctl", "start", "docker")
		return cmd.Run()
	default:
		return fmt.Errorf("unsupported operating system: %s", runtime.GOOS)
	}
}

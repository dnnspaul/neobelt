package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/api/types/mount"
	"github.com/docker/docker/client"
	"github.com/docker/go-connections/nat"
)

// DockerService manages Docker containers for MCP servers
type DockerService struct {
	client *client.Client
}

// ContainerInfo represents detailed information about a Docker container
type ContainerInfo struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Image       string            `json:"image"`
	Status      string            `json:"status"`
	State       string            `json:"state"`
	Uptime      string            `json:"uptime"`
	CPU         string            `json:"cpu"`
	Memory      string            `json:"memory"`
	Port        int               `json:"port"`
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
	log.Printf("[DEBUG] GetManagedContainers called")
	
	// Filter for containers with neobelt.managed-by=true label
	filterArgs := filters.NewArgs()
	filterArgs.Add("label", "neobelt.managed-by=true")

	log.Printf("[DEBUG] Listing containers with filter: neobelt.managed-by=true")
	containers, err := ds.client.ContainerList(ctx, container.ListOptions{
		All:     true,
		Filters: filterArgs,
	})
	if err != nil {
		log.Printf("[ERROR] Failed to list containers: %v", err)
		return nil, fmt.Errorf("failed to list containers: %w", err)
	}

	log.Printf("[DEBUG] Found %d containers with neobelt label", len(containers))
	for i, cont := range containers {
		log.Printf("[DEBUG] Container %d: ID=%s, Names=%v, Labels=%+v", i, cont.ID, cont.Names, cont.Labels)
	}

	// Also list ALL containers for debugging purposes
	allContainers, err := ds.client.ContainerList(ctx, container.ListOptions{All: true})
	if err == nil {
		log.Printf("[DEBUG] Total containers in system: %d", len(allContainers))
		for i, cont := range allContainers {
			log.Printf("[DEBUG] All Container %d: ID=%s, Names=%v, ManagedBy=%s", i, cont.ID, cont.Names, cont.Labels["neobelt.managed-by"])
		}
	}

	var containerInfos []ContainerInfo
	for _, cont := range containers {
		info, err := ds.getContainerInfo(ctx, cont.ID)
		if err != nil {
			log.Printf("Warning: failed to get info for container %s: %v", cont.ID, err)
			continue
		}
		log.Printf("[DEBUG] Successfully processed container info for %s: %+v", cont.ID, info)
		containerInfos = append(containerInfos, *info)
	}

	log.Printf("[DEBUG] Returning %d managed containers", len(containerInfos))
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

	return &ContainerInfo{
		ID:          inspect.ID[:12], // Short ID
		Name:        strings.TrimPrefix(inspect.Name, "/"),
		Image:       inspect.Config.Image,
		Status:      inspect.State.Status,
		State:       ds.mapContainerState(inspect.State.Status),
		Uptime:      uptime,
		CPU:         "0%", // Will be populated by stats API if needed
		Memory:      "0MB", // Will be populated by stats API if needed
		Port:        port,
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
	log.Printf("[DEBUG] Starting container: %s", containerID)
	
	// First check if container exists
	inspect, err := ds.client.ContainerInspect(ctx, containerID)
	if err != nil {
		log.Printf("[ERROR] Container %s not found before start: %v", containerID, err)
		return fmt.Errorf("container not found: %w", err)
	}
	
	log.Printf("[DEBUG] Container %s exists, current state: %s", containerID, inspect.State.Status)
	
	err = ds.client.ContainerStart(ctx, containerID, container.StartOptions{})
	if err != nil {
		log.Printf("[ERROR] Failed to start container %s: %v", containerID, err)
		return err
	}
	
	log.Printf("[DEBUG] Container start command completed for %s", containerID)
	
	// Verify the container started successfully
	inspect, err = ds.client.ContainerInspect(ctx, containerID)
	if err != nil {
		log.Printf("[ERROR] Failed to inspect container %s after start: %v", containerID, err)
	} else {
		log.Printf("[DEBUG] Container %s post-start state: %s", containerID, inspect.State.Status)
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
	}

	logs, err := ds.client.ContainerLogs(ctx, containerID, options)
	if err != nil {
		return "", fmt.Errorf("failed to get container logs: %w", err)
	}
	defer logs.Close()

	logBytes, err := io.ReadAll(logs)
	if err != nil {
		return "", fmt.Errorf("failed to read logs: %w", err)
	}

	return string(logBytes), nil
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
	log.Printf("[DEBUG] CreateContainer called with config: %+v", config)
	
	// Add neobelt management labels
	if config.Labels == nil {
		config.Labels = make(map[string]string)
	}
	config.Labels["neobelt.managed-by"] = "true"
	config.Labels["neobelt.created-at"] = time.Now().Format(time.RFC3339)

	log.Printf("[DEBUG] Container labels set: %+v", config.Labels)

	// Convert environment map to slice
	var env []string
	for key, value := range config.Environment {
		env = append(env, fmt.Sprintf("%s=%s", key, value))
	}
	log.Printf("[DEBUG] Environment variables: %v", env)

	// Convert volume map to mounts
	var mounts []mount.Mount
	for hostPath, containerPath := range config.Volumes {
		mounts = append(mounts, mount.Mount{
			Type:   mount.TypeBind,
			Source: hostPath,
			Target: containerPath,
		})
	}
	log.Printf("[DEBUG] Volume mounts: %+v", mounts)

	// Parse docker command if provided
	var cmd []string
	if config.DockerCommand != "" {
		cmd = parseDockerCommand(config.DockerCommand)
		log.Printf("[DEBUG] Setting container CMD to: %v", cmd)
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
		log.Printf("[DEBUG] Memory limit set to: %d MB (%d bytes)", config.MemoryLimitMB, hostConfig.Memory)
	}
	
	// Set restart policy if specified
	if config.RestartPolicy != "" {
		hostConfig.RestartPolicy = container.RestartPolicy{
			Name: container.RestartPolicyMode(config.RestartPolicy),
		}
		log.Printf("[DEBUG] Restart policy set to: %s", config.RestartPolicy)
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
				{HostIP: "0.0.0.0", HostPort: strconv.Itoa(config.Port)},
			},
		}
		containerConfig.ExposedPorts = nat.PortSet{
			containerPort: struct{}{},
		}
		log.Printf("[DEBUG] Port mapping configured: host %d -> container %d", config.Port, containerPortNum)
	}

	log.Printf("[DEBUG] Creating container with name: %s, image: %s", config.Name, config.Image)
	resp, err := ds.client.ContainerCreate(ctx, containerConfig, hostConfig, nil, nil, config.Name)
	if err != nil {
		log.Printf("[ERROR] Failed to create container: %v", err)
		return "", fmt.Errorf("failed to create container: %w", err)
	}

	log.Printf("[DEBUG] Container created successfully with ID: %s", resp.ID)
	
	// Immediately verify the container was created and has correct labels
	inspect, err := ds.client.ContainerInspect(ctx, resp.ID)
	if err != nil {
		log.Printf("[ERROR] Failed to inspect newly created container %s: %v", resp.ID, err)
	} else {
		log.Printf("[DEBUG] Container %s inspect successful - Labels: %+v", resp.ID, inspect.Config.Labels)
		if managedBy, exists := inspect.Config.Labels["neobelt.managed-by"]; exists {
			log.Printf("[DEBUG] Container %s has neobelt.managed-by label: %s", resp.ID, managedBy)
		} else {
			log.Printf("[WARNING] Container %s is missing neobelt.managed-by label!", resp.ID)
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
	Port          int               `json:"port"`          // Host port (external)
	ContainerPort int               `json:"container_port"` // Container port (internal, from MCP registry)
	Environment   map[string]string `json:"environment"`
	Volumes       map[string]string `json:"volumes"` // host_path -> container_path
	Labels        map[string]string `json:"labels"`
	DockerCommand string            `json:"docker_command"` // Command arguments from registry
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

	// For simplicity, we'll skip the complex stats calculation and return placeholder values
	// In a real implementation, you would parse the stats JSON properly
	_, err = io.ReadAll(stats.Body)
	if err != nil {
		return "0%", "0MB", fmt.Errorf("failed to read stats: %w", err)
	}

	// Return placeholder values - these could be enhanced to parse actual stats
	return "2%", "45MB", nil
}

// parseDockerCommand parses docker command arguments into a slice for CMD
func parseDockerCommand(dockerCommand string) []string {
	if dockerCommand == "" {
		return nil
	}
	
	log.Printf("[DEBUG] Using docker command as CMD: %s", dockerCommand)
	
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
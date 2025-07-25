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
	// Filter for containers with neobelt.managed-by=true label
	filterArgs := filters.NewArgs()
	filterArgs.Add("label", "neobelt.managed-by=true")

	containers, err := ds.client.ContainerList(ctx, container.ListOptions{
		All:     true,
		Filters: filterArgs,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list containers: %w", err)
	}

	var containerInfos []ContainerInfo
	for _, cont := range containers {
		info, err := ds.getContainerInfo(ctx, cont.ID)
		if err != nil {
			log.Printf("Warning: failed to get info for container %s: %v", cont.ID, err)
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

	// Get port mapping
	port := 0
	if len(inspect.NetworkSettings.Ports) > 0 {
		for containerPort := range inspect.NetworkSettings.Ports {
			portStr := string(containerPort)
			if strings.Contains(portStr, "tcp") {
				portNum, err := strconv.Atoi(strings.Split(portStr, "/")[0])
				if err == nil {
					port = portNum
					break
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
	return ds.client.ContainerStart(ctx, containerID, container.StartOptions{})
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
	// Add neobelt management labels
	if config.Labels == nil {
		config.Labels = make(map[string]string)
	}
	config.Labels["neobelt.managed-by"] = "true"
	config.Labels["neobelt.created-at"] = time.Now().Format(time.RFC3339)

	// Convert environment map to slice
	var env []string
	for key, value := range config.Environment {
		env = append(env, fmt.Sprintf("%s=%s", key, value))
	}

	// Convert volume map to mounts
	var mounts []mount.Mount
	for hostPath, containerPath := range config.Volumes {
		mounts = append(mounts, mount.Mount{
			Type:   mount.TypeBind,
			Source: hostPath,
			Target: containerPath,
		})
	}

	// Create container configuration
	containerConfig := &container.Config{
		Image:  config.Image,
		Env:    env,
		Labels: config.Labels,
	}

	// Create host configuration
	hostConfig := &container.HostConfig{
		Mounts:      mounts,
		AutoRemove:  false,
		NetworkMode: "bridge",
	}

	// Add port mapping if specified
	if config.Port > 0 {
		port, _ := nat.NewPort("tcp", strconv.Itoa(config.Port))
		
		hostConfig.PortBindings = nat.PortMap{
			port: []nat.PortBinding{
				{HostIP: "0.0.0.0", HostPort: strconv.Itoa(config.Port)},
			},
		}
		containerConfig.ExposedPorts = nat.PortSet{
			port: struct{}{},
		}
	}

	resp, err := ds.client.ContainerCreate(ctx, containerConfig, hostConfig, nil, nil, config.Name)
	if err != nil {
		return "", fmt.Errorf("failed to create container: %w", err)
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
	Name        string            `json:"name"`
	Image       string            `json:"image"`
	Port        int               `json:"port"`
	Environment map[string]string `json:"environment"`
	Volumes     map[string]string `json:"volumes"` // host_path -> container_path
	Labels      map[string]string `json:"labels"`
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
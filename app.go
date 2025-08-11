package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/emersion/go-autostart"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// min returns the minimum of two integers
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// App struct
type App struct {
	ctx           context.Context
	configManager *ConfigManager
	dockerService *DockerService
	dockerMonitor *DockerMonitor
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Initialize configuration manager
	configManager, err := NewConfigManager()
	if err != nil {
		LogError("Failed to initialize configuration manager: %v", err)
		// Continue with default behavior if config fails
		return
	}

	a.configManager = configManager
	LogInfo("Configuration loaded from: %s", configManager.GetConfigPath())

	// Initialize logger
	config := configManager.GetConfig()
	debugMode := false
	logRetention := 30
	if config != nil {
		debugMode = config.App.DebugMode
		logRetention = config.App.LogRetention
	}
	
	logDir := configManager.GetLogDir()
	if err := InitLogger(logDir, debugMode); err != nil {
		fmt.Printf("Warning: Failed to initialize logger: %v\n", err) // Keep as fmt since logger isn't initialized yet
	} else {
		LogInfo("Logger initialized successfully")
		// Clean up old logs
		if err := CleanupOldLogs(logDir, logRetention); err != nil {
			LogWarning("Failed to cleanup old logs: %v", err)
		}
	}

	// Initialize Docker service
	dockerService, err := NewDockerService()
	if err != nil {
		LogWarning("Failed to initialize Docker service: %v", err)
		// Continue without Docker functionality
	} else {
		a.dockerService = dockerService
		LogInfo("Docker service initialized successfully")
	}

	// Initialize and start Docker monitor
	a.dockerMonitor = NewDockerMonitor(a)
	a.dockerMonitor.Start()
	LogInfo("Docker monitor started")
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// Registry server definition structure
type RegistryServer struct {
	Name                 string         `json:"name"`
	Description          string         `json:"description"`
	SetupDescription     string         `json:"setup_description"`
	SupportURL           string         `json:"support_url"`
	DockerImage          string         `json:"docker_image"`
	Version              string         `json:"version"`
	License              string         `json:"license"`
	Maintainer           string         `json:"maintainer"`
	Tags                 []string       `json:"tags"`
	Architecture         []string       `json:"architecture"`
	HealthCheck          map[string]any `json:"health_check"`
	ResourceRequirements map[string]any `json:"resource_requirements"`
	DockerCommand        string         `json:"docker_command"`
	EnvironmentVariables map[string]any `json:"environment_variables"`
	Ports                map[string]any `json:"ports"`
	Volumes              []any          `json:"volumes"`
	// Added fields to track source registry
	SourceRegistryName string `json:"source_registry_name"`
	SourceRegistryURL  string `json:"source_registry_url"`
	IsOfficial         bool   `json:"is_official"`
}

// Registry structure
type Registry struct {
	Name         string `json:"name"`
	URL          string `json:"url"`
	Description  string `json:"description"`
	AuthType     string `json:"auth_type"`     // "none", "basic", "header"
	AuthUsername string `json:"auth_username"` // for basic auth
	AuthPassword string `json:"auth_password"` // for basic auth
	AuthHeader   string `json:"auth_header"`   // for custom header auth (e.g., "Authorization: Bearer token")
}

// FetchOfficialRegistry fetches servers from the official registry
func (a *App) FetchOfficialRegistry() ([]RegistryServer, error) {
	return a.fetchRegistryFromURL("https://dennis.paul.hamburg/neobelt/registry.json")
}

// FetchCustomRegistry fetches servers from a custom registry URL
func (a *App) FetchCustomRegistry(url string) ([]RegistryServer, error) {
	return a.fetchRegistryFromURLWithAuth(url, Registry{AuthType: "none"})
}

// fetchRegistryFromURL is a helper function to fetch registry data from any URL (for official registry)
func (a *App) fetchRegistryFromURL(url string) ([]RegistryServer, error) {
	return a.fetchRegistryFromURLWithAuth(url, Registry{AuthType: "none"})
}

// fetchRegistryFromURLWithAuth is a helper function to fetch registry data with authentication
func (a *App) fetchRegistryFromURLWithAuth(url string, registry Registry) ([]RegistryServer, error) {
	// Enforce HTTPS for custom registries (allow HTTP only for official registry)
	if url != "https://dennis.paul.hamburg/neobelt/registry.json" && !strings.HasPrefix(url, "https://") {
		return nil, fmt.Errorf("custom registries must use HTTPS")
	}

	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Add authentication based on registry settings
	switch registry.AuthType {
	case "basic":
		if registry.AuthUsername != "" && registry.AuthPassword != "" {
			req.SetBasicAuth(registry.AuthUsername, registry.AuthPassword)
		}
	case "header":
		if registry.AuthHeader != "" {
			// Parse header format: "Header-Name: Header-Value"
			parts := strings.SplitN(registry.AuthHeader, ":", 2)
			if len(parts) == 2 {
				headerName := strings.TrimSpace(parts[0])
				headerValue := strings.TrimSpace(parts[1])
				req.Header.Set(headerName, headerValue)
			}
		}
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch registry: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("registry returned status code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	var servers []RegistryServer
	err = json.Unmarshal(body, &servers)
	if err != nil {
		return nil, fmt.Errorf("failed to parse registry JSON: %w", err)
	}

	return servers, nil
}

// GetRegistries returns the list of configured registries with hardcoded official registry
func (a *App) GetRegistries() []Registry {
	// Always include the hardcoded official registry
	officialRegistry := Registry{
		Name:        "Official Registry",
		URL:         "https://dennis.paul.hamburg/neobelt/registry.json",
		Description: "Handpicked MCP servers by the Neobelt team",
		AuthType:    "none",
	}

	registries := []Registry{officialRegistry}

	if a.configManager != nil {
		// Add custom registries from config
		customRegistries := a.configManager.GetRegistries()
		registries = append(registries, customRegistries...)
	}

	return registries
}

// AddCustomRegistry adds a new custom registry
func (a *App) AddCustomRegistry(name, url, description, authType, authUsername, authPassword, authHeader string) error {
	// Create the registry entry for validation
	newRegistry := Registry{
		Name:         name,
		URL:          url,
		Description:  description,
		AuthType:     authType,
		AuthUsername: authUsername,
		AuthPassword: authPassword,
		AuthHeader:   authHeader,
	}

	// Validate that we can fetch from the URL with authentication
	_, err := a.fetchRegistryFromURLWithAuth(url, newRegistry)
	if err != nil {
		return fmt.Errorf("failed to validate registry: %w", err)
	}

	// Add to persistent configuration
	if a.configManager == nil {
		return fmt.Errorf("configuration manager not available")
	}

	return a.configManager.AddRegistry(newRegistry)
}

// FetchAllRegistries fetches servers from all configured registries
func (a *App) FetchAllRegistries() ([]RegistryServer, error) {
	registries := a.GetRegistries()
	var allServers []RegistryServer

	for _, registry := range registries {
		servers, err := a.fetchRegistryFromURLWithAuth(registry.URL, registry)
		if err != nil {
			// Log the error but continue with other registries
			LogWarning("Failed to fetch from registry %s: %v", registry.Name, err)
			continue
		}

		// Mark each server with its source registry information
		for i := range servers {
			servers[i].SourceRegistryName = registry.Name
			servers[i].SourceRegistryURL = registry.URL
			servers[i].IsOfficial = registry.Name == "Official Registry"
		}

		// Add servers from this registry to the combined list
		allServers = append(allServers, servers...)
	}

	return allServers, nil
}

// RemoveCustomRegistry removes a custom registry
func (a *App) RemoveCustomRegistry(url string) error {
	if a.configManager == nil {
		return fmt.Errorf("configuration manager not available")
	}

	// Prevent removal of the official registry
	if url == "https://dennis.paul.hamburg/neobelt/registry.json" {
		return fmt.Errorf("cannot remove the official registry")
	}

	return a.configManager.RemoveRegistry(url)
}

// UpdateCustomRegistry updates an existing registry
func (a *App) UpdateCustomRegistry(oldURL, name, newURL, description, authType, authUsername, authPassword, authHeader string) error {
	// Prevent updating the official registry
	if oldURL == "https://dennis.paul.hamburg/neobelt/registry.json" {
		return fmt.Errorf("cannot update the official registry")
	}

	// Create the updated registry entry
	updatedRegistry := Registry{
		Name:         name,
		URL:          newURL,
		Description:  description,
		AuthType:     authType,
		AuthUsername: authUsername,
		AuthPassword: authPassword,
		AuthHeader:   authHeader,
	}

	// Validate that we can fetch from the new URL with authentication
	_, err := a.fetchRegistryFromURLWithAuth(newURL, updatedRegistry)
	if err != nil {
		return fmt.Errorf("failed to validate registry: %w", err)
	}

	if a.configManager == nil {
		return fmt.Errorf("configuration manager not available")
	}

	return a.configManager.UpdateRegistry(oldURL, updatedRegistry)
}

// GetConfiguration returns the current application configuration
func (a *App) GetConfiguration() (*Configuration, error) {
	if a.configManager == nil {
		return nil, fmt.Errorf("configuration manager not available")
	}

	return a.configManager.GetConfig(), nil
}

// GetConfigPath returns the path to the configuration file
func (a *App) GetConfigPath() string {
	if a.configManager == nil {
		return ""
	}

	return a.configManager.GetConfigPath()
}

// GetServerDefaults returns the current server default settings
func (a *App) GetServerDefaults() (*ServerDefaultsConfig, error) {
	if a.configManager == nil {
		return nil, fmt.Errorf("configuration manager not available")
	}

	config := a.configManager.GetConfig()
	if config == nil {
		return nil, fmt.Errorf("no configuration available")
	}

	return &config.ServerDefaults, nil
}

// UpdateServerDefaults updates the server default settings and returns whether containers were recreated
func (a *App) UpdateServerDefaults(serverDefaults ServerDefaultsConfig) (bool, error) {
	if a.configManager == nil {
		return false, fmt.Errorf("configuration manager not available")
	}

	config := a.configManager.GetConfig()
	if config == nil {
		return false, fmt.Errorf("no configuration available")
	}

	// Check what settings have changed and need container recreation
	oldDefaults := config.ServerDefaults
	portChanged := oldDefaults.DefaultPort != serverDefaults.DefaultPort
	memoryChanged := oldDefaults.MaxMemoryMB != serverDefaults.MaxMemoryMB
	restartPolicyChanged := oldDefaults.RestartOnFailure != serverDefaults.RestartOnFailure
	
	// Only recreate containers if settings that affect them have changed
	containerRecreationNeeded := memoryChanged || restartPolicyChanged || portChanged

	config.ServerDefaults = serverDefaults

	// Save configuration first
	if err := a.configManager.Save(); err != nil {
		return false, err
	}

	// If port range changed, reallocate ports for existing servers
	if portChanged {
		if err := a.reallocatePorts(serverDefaults.DefaultPort); err != nil {
			LogWarning("Failed to reallocate ports: %v", err)
			// Don't fail the settings update if port reallocation fails
		}
	}

	// Apply new memory limits and restart policies to existing containers only if needed
	if containerRecreationNeeded {
		logMessage := "Container recreation needed due to changes in:"
		if memoryChanged {
			logMessage += fmt.Sprintf(" memory limit (%d -> %d MB)", oldDefaults.MaxMemoryMB, serverDefaults.MaxMemoryMB)
		}
		if restartPolicyChanged {
			logMessage += fmt.Sprintf(" restart policy (%t -> %t)", oldDefaults.RestartOnFailure, serverDefaults.RestartOnFailure)
		}
		if portChanged {
			logMessage += fmt.Sprintf(" default port (%d -> %d)", oldDefaults.DefaultPort, serverDefaults.DefaultPort)
		}
		LogInfo(logMessage)
		
		if err := a.applySettingsToExistingContainers(serverDefaults); err != nil {
			LogWarning("Failed to apply some settings to existing containers: %v", err)
			// Don't fail the settings update if container updates fail
		}
	} else {
		LogInfo("No container recreation needed - only AutoStart setting changed")
	}

	return containerRecreationNeeded, nil
}

// reallocatePorts reallocates ports for all configured servers starting from the new default port
func (a *App) reallocatePorts(newDefaultPort int) error {
	if a.configManager == nil {
		return fmt.Errorf("configuration manager not available")
	}

	configuredServers := a.configManager.GetConfiguredServers()
	if len(configuredServers) == 0 {
		return nil // No servers to update
	}

	// Create a map to track new port assignments
	usedPorts := make(map[int]bool)
	nextPort := newDefaultPort

	// Reallocate ports for each configured server
	for _, server := range configuredServers {
		// Find next available port
		for usedPorts[nextPort] {
			nextPort++
			if nextPort > 65535 {
				return fmt.Errorf("no available ports in valid range")
			}
		}

		oldPort := server.Port
		server.Port = nextPort
		usedPorts[nextPort] = true

		// Update the configured server in the database
		if err := a.configManager.AddOrUpdateConfiguredServer(server); err != nil {
			return fmt.Errorf("failed to update configured server %s: %w", server.ID, err)
		}

		// Update the actual Docker container port mapping if it exists and is running
		if a.dockerService != nil && server.ContainerID != "" {
			if err := a.updateContainerPort(server.ContainerID, oldPort, nextPort); err != nil {
				LogWarning("Failed to update container port for %s: %v", server.ContainerID, err)
				// Continue with other servers even if one fails
			}
		}

		nextPort++
		LogInfo("Reallocated port for server %s: %d -> %d", server.Name, oldPort, server.Port)
	}

	return nil
}

// updateContainerPort updates the port mapping for an existing container by recreating it
func (a *App) updateContainerPort(containerID string, oldPort, newPort int) error {
	if oldPort == newPort {
		return nil // No change needed
	}

	if a.dockerService == nil {
		return fmt.Errorf("docker service not available")
	}

	// Get container information first
	containers, err := a.dockerService.GetManagedContainers(a.ctx)
	if err != nil {
		return fmt.Errorf("failed to get container info: %w", err)
	}

	var containerInfo *ContainerInfo
	for _, container := range containers {
		if container.ID == containerID || strings.HasPrefix(container.ID, containerID) {
			containerInfo = &container
			break
		}
	}

	if containerInfo == nil {
		return fmt.Errorf("container %s not found", containerID)
	}

	// Check if container is running - only recreate if it's running
	if containerInfo.State != "running" {
		LogInfo("Container %s is not running (%s), port change will apply on next start", containerID, containerInfo.State)
		return nil
	}

	LogInfo("Recreating container %s to change port mapping: %d -> %d", containerID, oldPort, newPort)

	// Get server defaults for recreation
	serverDefaults, err := a.GetServerDefaults()
	if err != nil {
		return fmt.Errorf("failed to get server defaults: %w", err)
	}

	// Stop the container
	LogInfo("Stopping container %s for port change...", containerID)
	if err := a.dockerService.StopContainer(a.ctx, containerID); err != nil {
		return fmt.Errorf("failed to stop container: %w", err)
	}

	// Get the configured server info to recreate the container
	configuredServers := a.configManager.GetConfiguredServers()
	var configuredServer *ConfiguredServer
	for _, server := range configuredServers {
		if server.ContainerID == containerID || strings.HasPrefix(server.ContainerID, containerID) {
			configuredServer = &server
			break
		}
	}

	if configuredServer == nil {
		return fmt.Errorf("configured server info not found for container %s", containerID)
	}

	// Remove the old container
	LogInfo("Removing old container %s...", containerID)
	if err := a.dockerService.RemoveContainer(a.ctx, containerID, true); err != nil {
		return fmt.Errorf("failed to remove old container: %w", err)
	}

	// Create new container with updated port
	newConfig := ContainerCreateConfig{
		Name:          containerInfo.Name,
		Image:         containerInfo.Image,
		Port:          newPort,                        // Use the new port
		ContainerPort: configuredServer.ContainerPort, // Use stored container port
		Environment:   configuredServer.Environment,
		Volumes:       convertVolumesToMap(containerInfo.Volumes),
		Labels:        containerInfo.Labels,
		DockerCommand: "", // We don't store the original docker command
		MemoryLimitMB: serverDefaults.MaxMemoryMB,
		RestartPolicy: func() string {
			if serverDefaults.RestartOnFailure {
				return "on-failure"
			}
			return "no"
		}(),
	}

	LogInfo("Creating new container with host port %d and container port %d", newPort, newConfig.ContainerPort)

	newContainerID, err := a.dockerService.CreateContainer(a.ctx, newConfig)
	if err != nil {
		return fmt.Errorf("failed to create new container with new port: %w", err)
	}

	// Update the configured server with the new container ID
	configuredServer.ContainerID = newContainerID
	if err := a.configManager.AddOrUpdateConfiguredServer(*configuredServer); err != nil {
		LogWarning("Failed to update configured server with new container ID: %v", err)
	}

	// Start the new container
	LogInfo("Starting new container %s with port %d...", newContainerID, newPort)
	if err := a.dockerService.StartContainer(a.ctx, newContainerID); err != nil {
		return fmt.Errorf("failed to start new container: %w", err)
	}

	LogInfo("Successfully recreated container with new port: %s -> %s (port %d -> %d)",
		containerID, newContainerID, oldPort, newPort)
	return nil
}

// applySettingsToExistingContainers applies new server defaults to existing containers
func (a *App) applySettingsToExistingContainers(serverDefaults ServerDefaultsConfig) error {
	if a.configManager == nil || a.dockerService == nil {
		return fmt.Errorf("configuration manager or docker service not available")
	}

	configuredServers := a.configManager.GetConfiguredServers()
	if len(configuredServers) == 0 {
		return nil // No servers to update
	}

	for _, server := range configuredServers {
		if server.ContainerID == "" {
			continue // Skip servers without container IDs
		}

		// Try to update container settings
		if err := a.updateContainerSettings(server.ContainerID, serverDefaults); err != nil {
			LogWarning("Failed to update settings for container %s (%s): %v",
				server.ContainerID, server.Name, err)
			// Continue with other containers
		} else {
			LogInfo("Updated settings for container %s (%s)", server.ContainerID, server.Name)
		}
	}

	return nil
}

// updateContainerSettings updates memory and restart policy for an existing container by recreating it
func (a *App) updateContainerSettings(containerID string, serverDefaults ServerDefaultsConfig) error {
	if a.dockerService == nil {
		return fmt.Errorf("docker service not available")
	}

	// Get container information first
	containers, err := a.dockerService.GetManagedContainers(a.ctx)
	if err != nil {
		return fmt.Errorf("failed to get container info: %w", err)
	}

	var containerInfo *ContainerInfo
	for _, container := range containers {
		if container.ID == containerID || strings.HasPrefix(container.ID, containerID) || strings.HasPrefix(containerID, container.ID) {
			containerInfo = &container
			break
		}
	}

	if containerInfo == nil {
		return fmt.Errorf("container %s not found", containerID)
	}

	// Check if container is running - only recreate if it's running
	if containerInfo.State != "running" {
		LogInfo("Container %s is not running (%s), skipping recreation", containerID, containerInfo.State)
		return nil
	}

	LogInfo("Recreating container %s to apply new settings...", containerID)

	// Stop the container
	LogInfo("Stopping container %s...", containerID)
	if err := a.dockerService.StopContainer(a.ctx, containerID); err != nil {
		return fmt.Errorf("failed to stop container: %w", err)
	}

	// Get the configured server info to recreate the container
	configuredServers := a.configManager.GetConfiguredServers()
	var configuredServer *ConfiguredServer
	for _, server := range configuredServers {
		if server.ContainerID == containerID || strings.HasPrefix(server.ContainerID, containerID) {
			configuredServer = &server
			break
		}
	}

	if configuredServer == nil {
		return fmt.Errorf("configured server info not found for container %s", containerID)
	}

	// Remove the old container
	LogInfo("Removing old container %s...", containerID)
	if err := a.dockerService.RemoveContainer(a.ctx, containerID, true); err != nil {
		return fmt.Errorf("failed to remove old container: %w", err)
	}

	// Create new container with updated settings
	newConfig := ContainerCreateConfig{
		Name:          containerInfo.Name,
		Image:         containerInfo.Image,
		Port:          configuredServer.Port,          // Use the potentially updated port
		ContainerPort: configuredServer.ContainerPort, // Use stored container port
		Environment:   configuredServer.Environment,
		Volumes:       convertVolumesToMap(containerInfo.Volumes),
		Labels:        containerInfo.Labels,
		DockerCommand: "", // We don't store the original docker command
		MemoryLimitMB: serverDefaults.MaxMemoryMB,
		RestartPolicy: func() string {
			if serverDefaults.RestartOnFailure {
				return "on-failure"
			}
			return "no"
		}(),
	}

	LogInfo("Creating new container with updated settings: Memory=%dMB, RestartPolicy=%s, HostPort=%d, ContainerPort=%d",
		newConfig.MemoryLimitMB, newConfig.RestartPolicy, newConfig.Port, newConfig.ContainerPort)

	newContainerID, err := a.dockerService.CreateContainer(a.ctx, newConfig)
	if err != nil {
		return fmt.Errorf("failed to create new container: %w", err)
	}

	// Update the configured server with the new container ID
	configuredServer.ContainerID = newContainerID
	if err := a.configManager.AddOrUpdateConfiguredServer(*configuredServer); err != nil {
		LogWarning("Failed to update configured server with new container ID: %v", err)
	}

	// Start the new container (respecting auto-start setting would have been applied during original creation)
	LogInfo("Starting new container %s...", newContainerID)
	if err := a.dockerService.StartContainer(a.ctx, newContainerID); err != nil {
		return fmt.Errorf("failed to start new container: %w", err)
	}

	LogInfo("Successfully recreated container: %s -> %s", containerID, newContainerID)
	return nil
}

// convertVolumesToMap converts volume slice to map format expected by ContainerCreateConfig
func convertVolumesToMap(volumes []string) map[string]string {
	volumeMap := make(map[string]string)
	for _, volume := range volumes {
		parts := strings.Split(volume, ":")
		if len(parts) >= 2 {
			volumeMap[parts[0]] = parts[1]
		}
	}
	return volumeMap
}

// Docker API methods

// GetManagedContainers returns all Docker containers managed by neobelt
func (a *App) GetManagedContainers() ([]ContainerInfo, error) {
	if a.dockerService == nil {
		return nil, fmt.Errorf("docker service not available")
	}

	// Clean up orphaned containers before returning the managed ones
	if err := a.CleanupOrphanedContainers(); err != nil {
		LogWarning("Failed to cleanup orphaned containers: %v", err)
		// Continue even if cleanup fails - we still want to return the current containers
	}

	containers, err := a.dockerService.GetManagedContainers(a.ctx)
	if err != nil {
		LogError("Docker service GetManagedContainers failed: %v", err)
		return nil, err
	}

	// Enrich containers with version information from configured servers
	if a.configManager != nil {
		configuredServers := a.configManager.GetConfiguredServers()

		// Create a map for quick lookup by container ID
		configMap := make(map[string]ConfiguredServer)
		for _, config := range configuredServers {
			if config.ContainerID != "" {
				configMap[config.ContainerID] = config
			}
		}

		// Enrich each container with version and display name information
		for i := range containers {
			container := &containers[i]

			// Look for matching configured server by container ID (handle both short and full IDs)
			for configContainerID, config := range configMap {
				if configContainerID == container.ID ||
					configContainerID[:min(len(configContainerID), len(container.ID))] == container.ID ||
					container.ID[:min(len(configContainerID), len(container.ID))] == configContainerID {

					container.Version = config.Version
					container.DisplayName = config.Name
					break
				}
			}

			// Set defaults if no configuration found
			if container.Version == "" {
				container.Version = "unknown"
			}
			if container.DisplayName == "" {
				container.DisplayName = container.Name // Fallback to container name
			}
		}
	}

	return containers, nil
}

// StartContainer starts a Docker container
func (a *App) StartContainer(containerID string) error {
	LogDebug("App.StartContainer called for container: %s", containerID)

	if a.dockerService == nil {
		LogError("Docker service not available")
		return fmt.Errorf("Docker service not available")
	}

	err := a.dockerService.StartContainer(a.ctx, containerID)
	if err != nil {
		LogError("Docker service StartContainer failed for %s: %v", containerID, err)
		return err
	}

	LogDebug("App.StartContainer completed successfully for: %s", containerID)
	return nil
}

// StopContainer stops a Docker container
func (a *App) StopContainer(containerID string) error {
	if a.dockerService == nil {
		return fmt.Errorf("Docker service not available")
	}

	return a.dockerService.StopContainer(a.ctx, containerID)
}

// RestartContainer restarts a Docker container
func (a *App) RestartContainer(containerID string) error {
	if a.dockerService == nil {
		return fmt.Errorf("Docker service not available")
	}

	return a.dockerService.RestartContainer(a.ctx, containerID)
}

// GetContainerLogs retrieves logs from a Docker container
func (a *App) GetContainerLogs(containerID string, lines int) (string, error) {
	if a.dockerService == nil {
		return "", fmt.Errorf("Docker service not available")
	}

	return a.dockerService.GetContainerLogs(a.ctx, containerID, lines)
}

// RemoveContainer removes a Docker container and its configuration
func (a *App) RemoveContainer(containerID string, force bool) error {
	if a.dockerService == nil {
		return fmt.Errorf("Docker service not available")
	}

	// Remove the Docker container
	err := a.dockerService.RemoveContainer(a.ctx, containerID, force)
	if err != nil {
		return err
	}

	// Remove configured server entry if it exists
	if a.configManager != nil {
		configuredServers := a.configManager.GetConfiguredServers()
		for _, server := range configuredServers {
			// Handle both short and full container IDs (similar to frontend logic)
			if server.ContainerID == containerID ||
				(len(server.ContainerID) > len(containerID) && strings.HasPrefix(server.ContainerID, containerID)) ||
				(len(containerID) > len(server.ContainerID) && strings.HasPrefix(containerID, server.ContainerID)) {
				if removeErr := a.configManager.RemoveConfiguredServer(server.ID); removeErr != nil {
					// Log the error but don't fail the operation
					LogWarning("Failed to remove configured server entry for container %s: %v", containerID, removeErr)
				} else {
					LogInfo("Successfully removed configured server entry for container %s", containerID)
				}
				break
			}
		}
	}

	return nil
}

// GetInstalledServersWithVersionCheck returns installed servers with version check information
func (a *App) GetInstalledServersWithVersionCheck() ([]map[string]any, error) {
	if a.configManager == nil {
		return nil, fmt.Errorf("configuration manager not available")
	}

	installedServers := a.configManager.GetInstalledServers()
	result := make([]map[string]any, 0, len(installedServers))

	// Get all registry servers for version comparison
	registryServers, err := a.FetchAllRegistries()
	if err != nil {
		// If we can't fetch registry data, just return installed servers without version info
		for _, server := range installedServers {
			serverInfo := map[string]any{
				"installed_server": server,
				"update_available": false,
				"latest_version":   "",
				"registry_error":   err.Error(),
			}
			result = append(result, serverInfo)
		}
		return result, nil
	}

	// Create a map for quick lookup of registry servers
	registryMap := make(map[string]RegistryServer)
	for _, regServer := range registryServers {
		registryMap[regServer.DockerImage] = regServer
	}

	// Check each installed server for updates
	for _, installed := range installedServers {
		serverInfo := map[string]any{
			"installed_server": installed,
			"update_available": false,
			"latest_version":   installed.Version,
		}

		// Find matching registry server
		if regServer, exists := registryMap[installed.DockerImage]; exists {
			serverInfo["registry_server"] = regServer
			serverInfo["latest_version"] = regServer.Version

			// Simple version comparison - in reality you'd want semantic versioning
			if regServer.Version != installed.Version {
				serverInfo["update_available"] = true
			}
		}

		result = append(result, serverInfo)
	}

	return result, nil
}

// PullImage pulls a Docker image
func (a *App) PullImage(imageName string) error {
	if a.dockerService == nil {
		return fmt.Errorf("Docker service not available")
	}

	return a.dockerService.PullImage(a.ctx, imageName)
}

// CreateContainer creates a new Docker container with neobelt labels
func (a *App) CreateContainer(config ContainerCreateConfig) (string, error) {
	LogDebug("App.CreateContainer called with config: %+v", config)

	if a.dockerService == nil {
		LogError("Docker service not available")
		return "", fmt.Errorf("Docker service not available")
	}

	containerId, err := a.dockerService.CreateContainer(a.ctx, config)
	if err != nil {
		LogError("Docker service CreateContainer failed: %v", err)
		return "", err
	}

	LogDebug("App.CreateContainer completed successfully, returning ID: %s", containerId)
	return containerId, nil
}

// InstallServer installs a server from the registry (pulls image and updates config)
func (a *App) InstallServer(server RegistryServer) error {
	// Pull the Docker image
	if err := a.PullImage(server.DockerImage); err != nil {
		return fmt.Errorf("failed to pull image %s: %w", server.DockerImage, err)
	}

	// Add server to installed servers configuration
	if a.configManager == nil {
		return fmt.Errorf("configuration manager not available")
	}

	installedServer := InstalledServer{
		ID:                   fmt.Sprintf("%s-%d", strings.ToLower(strings.ReplaceAll(server.Name, " ", "-")), time.Now().Unix()),
		Name:                 server.Name,
		DockerImage:          server.DockerImage,
		Version:              server.Version,
		Description:          server.Description,
		SetupDescription:     server.SetupDescription,
		SupportURL:           server.SupportURL,
		License:              server.License,
		Maintainer:           server.Maintainer,
		Tags:                 server.Tags,
		Architecture:         server.Architecture,
		HealthCheck:          server.HealthCheck,
		ResourceRequirements: server.ResourceRequirements,
		DockerCommand:        server.DockerCommand,
		EnvironmentVariables: server.EnvironmentVariables,
		Ports:                server.Ports,
		Volumes:              server.Volumes,
		InstallDate:          time.Now().Format(time.RFC3339),
		LastUpdated:          time.Now().Format(time.RFC3339),
		SourceRegistry:       server.SourceRegistryName,
		IsOfficial:           server.IsOfficial,
	}

	return a.configManager.AddOrUpdateInstalledServer(installedServer)
}

// GetInstalledServers returns all installed servers (those that have images pulled)
func (a *App) GetInstalledServers() ([]InstalledServer, error) {
	if a.configManager == nil {
		return nil, fmt.Errorf("configuration manager not available")
	}

	return a.configManager.GetInstalledServers(), nil
}

// GetConfiguredServers returns all configured servers (actual Docker containers)
func (a *App) GetConfiguredServers() ([]ConfiguredServer, error) {
	if a.configManager == nil {
		return nil, fmt.Errorf("configuration manager not available")
	}

	return a.configManager.GetConfiguredServers(), nil
}

// getMCPPortFromRegistry extracts the MCP port from registry server data
func getMCPPortFromRegistry(server *RegistryServer) int {
	if server.Ports == nil {
		return 0
	}

	// Try to get the "mcp" port from the ports map
	if mcpPort, exists := server.Ports["mcp"]; exists {
		switch v := mcpPort.(type) {
		case float64:
			return int(v)
		case int:
			return v
		case string:
			if port, err := strconv.Atoi(v); err == nil {
				return port
			}
		}
	}

	return 0
}

// getMCPPortFromInstalledServer extracts the MCP port from installed server data
func getMCPPortFromInstalledServer(server *InstalledServer) int {
	if server.Ports == nil {
		return 0
	}

	// Try to get the "mcp" port from the ports map
	if mcpPort, exists := server.Ports["mcp"]; exists {
		switch v := mcpPort.(type) {
		case float64:
			return int(v)
		case int:
			return v
		case string:
			if port, err := strconv.Atoi(v); err == nil {
				return port
			}
		}
	}

	return 0
}

// CreateConfiguredServer creates a new configured server entry when a container is created
func (a *App) CreateConfiguredServer(installedServerID, containerName, containerID string, port int, environment, volumes map[string]string) error {
	if a.configManager == nil {
		return fmt.Errorf("configuration manager not available")
	}

	// Get the installed server details
	installedServer := a.findInstalledServerByID(installedServerID)
	if installedServer == nil {
		return fmt.Errorf("installed server with ID %s not found", installedServerID)
	}

	// Extract container port from registry data
	containerPort := getMCPPortFromInstalledServer(installedServer)

	configuredServer := ConfiguredServer{
		ID:                fmt.Sprintf("configured-%d", time.Now().Unix()),
		Version:           installedServer.Version,
		Name:              installedServer.Name,
		ContainerName:     containerName,
		ContainerID:       containerID,
		InstalledServerID: installedServerID,
		DockerImage:       installedServer.DockerImage,
		DockerCommand:     installedServer.DockerCommand,
		Port:              port,
		ContainerPort:     containerPort,
		Environment:       environment,
		Volumes:           volumes,
		CreatedDate:       time.Now().Format(time.RFC3339),
		LastStarted:       "",
		AutoStart:         false,
	}

	return a.configManager.AddOrUpdateConfiguredServer(configuredServer)
}

// RemoveInstalledServer removes an installed server and optionally its Docker image
func (a *App) RemoveInstalledServer(serverID string, removeImage bool) error {
	if a.configManager == nil {
		return fmt.Errorf("configuration manager not available")
	}

	// Get the installed server first
	installedServer := a.findInstalledServerByID(serverID)
	if installedServer == nil {
		return fmt.Errorf("installed server with ID %s not found", serverID)
	}

	// Remove any configured servers that depend on this installed server
	configuredServers := a.configManager.GetConfiguredServers()
	for _, configServer := range configuredServers {
		if configServer.InstalledServerID == serverID {
			// Remove the container first if it exists
			if configServer.ContainerID != "" && a.dockerService != nil {
				_ = a.dockerService.RemoveContainer(a.ctx, configServer.ContainerID, true)
			}
			// Remove the configured server entry
			_ = a.configManager.RemoveConfiguredServer(configServer.ID)
		}
	}

	// Remove the Docker image if requested
	if removeImage && a.dockerService != nil {
		if err := a.dockerService.RemoveImage(a.ctx, installedServer.DockerImage, false); err != nil {
			LogWarning("Failed to remove Docker image %s: %v", installedServer.DockerImage, err)
		}
	}

	// Remove the installed server entry
	return a.configManager.RemoveInstalledServer(serverID)
}

// findInstalledServerByID finds an installed server by ID
func (a *App) findInstalledServerByID(id string) *InstalledServer {
	if a.configManager == nil {
		return nil
	}

	installedServers := a.configManager.GetInstalledServers()
	for _, server := range installedServers {
		if server.ID == id {
			return &server
		}
	}
	return nil
}

// GetOrphanedContainers returns containers managed by neobelt but not in configuration
func (a *App) GetOrphanedContainers() ([]ContainerInfo, error) {
	if a.dockerService == nil {
		return nil, fmt.Errorf("Docker service not available")
	}

	if a.configManager == nil {
		return nil, fmt.Errorf("configuration manager not available")
	}

	configuredServers := a.configManager.GetConfiguredServers()
	return a.dockerService.GetOrphanedManagedContainers(a.ctx, configuredServers)
}

// CleanupOrphanedContainers removes orphaned neobelt containers
func (a *App) CleanupOrphanedContainers() error {
	if a.dockerService == nil {
		return fmt.Errorf("Docker service not available")
	}

	if a.configManager == nil {
		return fmt.Errorf("configuration manager not available")
	}

	configuredServers := a.configManager.GetConfiguredServers()
	return a.dockerService.CleanupOrphanedContainers(a.ctx, configuredServers)
}

// GetAppConfig returns the current app configuration
func (a *App) GetAppConfig() (*AppConfig, error) {
	if a.configManager == nil {
		return nil, fmt.Errorf("configuration manager not available")
	}

	config := a.configManager.GetConfig()
	if config == nil {
		return nil, fmt.Errorf("no configuration available")
	}

	// Create a copy and update the autostart status with the actual OS-level status
	appConfig := config.App
	appConfig.AutoStart = a.isAutostartEnabled()

	return &appConfig, nil
}

// UpdateAppConfig updates the app configuration
func (a *App) UpdateAppConfig(appConfig AppConfig) error {
	if a.configManager == nil {
		return fmt.Errorf("configuration manager not available")
	}

	config := a.configManager.GetConfig()
	if config == nil {
		return fmt.Errorf("no configuration available")
	}

	// Check if autostart setting changed and handle it
	oldConfig := config.App
	if oldConfig.AutoStart != appConfig.AutoStart {
		if err := a.handleAutostartChange(appConfig.AutoStart); err != nil {
			LogWarning("Failed to update autostart setting: %v", err)
			// Don't fail the entire config update if autostart fails
		}
	}

	// Check if debug mode changed and update logger
	if oldConfig.DebugMode != appConfig.DebugMode {
		SetDebugMode(appConfig.DebugMode)
	}

	config.App = appConfig

	// Save configuration
	return a.configManager.Save()
}

// handleAutostartChange manages the OS-level autostart setting
func (a *App) handleAutostartChange(enable bool) error {
	app := &autostart.App{
		Name:        "Neobelt",
		DisplayName: "Neobelt - MCP Server Manager",
		Exec:        []string{getExecutablePath()},
	}

	if enable {
		LogInfo("Enabling autostart for Neobelt...")
		return app.Enable()
	} else {
		LogInfo("Disabling autostart for Neobelt...")
		return app.Disable()
	}
}

// getExecutablePath returns the path to the current executable
func getExecutablePath() string {
	exec, err := os.Executable()
	if err != nil {
		LogWarning("Could not get executable path: %v", err)
		return "neobelt" // fallback
	}
	
	// Get absolute path
	absPath, err := filepath.Abs(exec)
	if err != nil {
		LogWarning("Could not get absolute path: %v", err)
		return exec
	}
	
	return absPath
}

// isAutostartEnabled checks if autostart is currently enabled at OS level
func (a *App) isAutostartEnabled() bool {
	app := &autostart.App{
		Name:        "Neobelt",
		DisplayName: "Neobelt - MCP Server Manager",
		Exec:        []string{getExecutablePath()},
	}
	
	return app.IsEnabled()
}

// GetRemoteAccess returns the current remote access configuration
func (a *App) GetRemoteAccess() (*RemoteAccessConfig, error) {
	if a.configManager == nil {
		return nil, fmt.Errorf("configuration manager not available")
	}

	config := a.configManager.GetConfig()
	if config == nil {
		return &RemoteAccessConfig{
			RemoteServer: "remote.neobelt.io",
			Username:     "",
			PrivateKey:   "",
			PublicKey:    "",
			KeyGenerated: false,
		}, nil
	}

	return &config.RemoteAccess, nil
}

// UpdateRemoteAccess updates the remote access configuration
func (a *App) UpdateRemoteAccess(remoteAccess RemoteAccessConfig) error {
	if a.configManager == nil {
		return fmt.Errorf("configuration manager not available")
	}

	config := a.configManager.GetConfig()
	if config == nil {
		return fmt.Errorf("no configuration loaded")
	}

	config.RemoteAccess = remoteAccess
	return a.configManager.Save()
}

// GenerateSSHKeys generates a new SSH key pair for remote access
func (a *App) GenerateSSHKeys() (*SSHKeyPair, error) {
	if a.configManager == nil {
		return nil, fmt.Errorf("configuration manager not available")
	}

	// Generate new key pair
	keyPair, err := GenerateSSHKeyPair()
	if err != nil {
		return nil, fmt.Errorf("failed to generate SSH key pair: %w", err)
	}

	// Update configuration
	config := a.configManager.GetConfig()
	if config == nil {
		return nil, fmt.Errorf("no configuration loaded")
	}

	config.RemoteAccess.PrivateKey = keyPair.PrivateKey
	config.RemoteAccess.PublicKey = keyPair.PublicKey
	config.RemoteAccess.KeyGenerated = true

	// Save configuration
	if err := a.configManager.Save(); err != nil {
		return nil, fmt.Errorf("failed to save configuration: %w", err)
	}

	return keyPair, nil
}

// GetSSHPublicKey returns the current SSH public key
func (a *App) GetSSHPublicKey() (string, error) {
	if a.configManager == nil {
		return "", fmt.Errorf("configuration manager not available")
	}

	config := a.configManager.GetConfig()
	if config == nil {
		return "", fmt.Errorf("no configuration loaded")
	}

	// If we have a private key but no public key, derive it
	if config.RemoteAccess.PrivateKey != "" && config.RemoteAccess.PublicKey == "" {
		publicKey, err := GetPublicKeyFromPrivate(config.RemoteAccess.PrivateKey)
		if err != nil {
			return "", fmt.Errorf("failed to derive public key from private key: %w", err)
		}

		// Update configuration with derived public key
		config.RemoteAccess.PublicKey = publicKey
		if err := a.configManager.Save(); err != nil {
			return "", fmt.Errorf("failed to save derived public key: %w", err)
		}

		return publicKey, nil
	}

	return config.RemoteAccess.PublicKey, nil
}

// CheckDockerStatus checks the current status of Docker daemon and Docker Desktop installation
func (a *App) CheckDockerStatus() (*DockerStatus, error) {
	if a.dockerService == nil {
		return &DockerStatus{
			IsRunning:             false,
			IsDockerDesktopInstalled: false,
		}, nil
	}
	
	return a.dockerService.CheckDockerStatus(a.ctx), nil
}

// StartDockerDesktop attempts to start Docker Desktop
func (a *App) StartDockerDesktop() error {
	if a.dockerService == nil {
		return fmt.Errorf("docker service not available")
	}
	
	return a.dockerService.StartDockerDesktop()
}

// OpenDockerDesktopDownloadURL opens the Docker Desktop download page
func (a *App) OpenDockerDesktopDownloadURL() error {
	// Import the runtime package for browser opening
	return a.openURL("https://www.docker.com/products/docker-desktop/")
}

// openURL opens a URL in the default browser using Wails runtime
func (a *App) openURL(url string) error {
	runtime.BrowserOpenURL(a.ctx, url)
	return nil
}

// DockerMonitor handles periodic Docker status checks
type DockerMonitor struct {
	app    *App
	ticker *time.Ticker
	done   chan bool
}

// NewDockerMonitor creates a new Docker monitor
func NewDockerMonitor(app *App) *DockerMonitor {
	return &DockerMonitor{
		app:  app,
		done: make(chan bool),
	}
}

// Start begins the periodic Docker status monitoring (every 15 seconds)
func (dm *DockerMonitor) Start() {
	dm.ticker = time.NewTicker(15 * time.Second)
	
	// Check immediately on start
	go dm.checkDockerStatus()
	
	// Then check every 15 seconds
	go func() {
		for {
			select {
			case <-dm.done:
				return
			case <-dm.ticker.C:
				dm.checkDockerStatus()
			}
		}
	}()
}

// Stop stops the Docker monitoring
func (dm *DockerMonitor) Stop() {
	if dm.ticker != nil {
		dm.ticker.Stop()
	}
	dm.done <- true
}

// checkDockerStatus performs the actual Docker status check and handles the results
func (dm *DockerMonitor) checkDockerStatus() {
	status, err := dm.app.CheckDockerStatus()
	if err != nil {
		LogError("Failed to check Docker status: %v", err)
		return
	}
	
	if !status.IsDockerDesktopInstalled {
		// Docker Desktop is not installed - emit event to show modal
		dm.emitDockerStatusEvent("docker_not_installed", status)
		return
	}
	
	if !status.IsRunning {
		// Docker is installed but not running - show modal to ask user to start it
		LogInfo("Docker is not running, showing modal to user...")
		dm.emitDockerStatusEvent("docker_not_running", status)
		return
	}
	
	// Docker is running - emit success event
	dm.emitDockerStatusEvent("docker_running", status)
}

// emitDockerStatusEvent sends Docker status events to the frontend
func (dm *DockerMonitor) emitDockerStatusEvent(eventType string, status *DockerStatus) {
	runtime.EventsEmit(dm.app.ctx, "docker_status_update", map[string]interface{}{
		"type":   eventType,
		"status": status,
	})
}

// OpenLogsDirectory opens the logs directory in the system file explorer
func (a *App) OpenLogsDirectory() error {
	if a.configManager == nil {
		return fmt.Errorf("configuration manager not available")
	}
	
	logDir := a.configManager.GetLogDir()
	runtime.BrowserOpenURL(a.ctx, "file://"+logDir)
	return nil
}

// ClearAllLogs removes all log files from the logs directory
func (a *App) ClearAllLogs() error {
	if a.configManager == nil {
		return fmt.Errorf("configuration manager not available")
	}
	
	logDir := a.configManager.GetLogDir()
	entries, err := os.ReadDir(logDir)
	if err != nil {
		return fmt.Errorf("failed to read logs directory: %w", err)
	}
	
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		
		// Only remove .log files
		if strings.HasSuffix(entry.Name(), ".log") {
			logPath := filepath.Join(logDir, entry.Name())
			if err := os.Remove(logPath); err != nil {
				LogWarning("Failed to remove log file %s: %v", logPath, err)
			} else {
				LogInfo("Removed log file: %s", entry.Name())
			}
		}
	}
	
	return nil
}

// ExportConfiguration exports the current configuration to an encrypted file using save dialog
func (a *App) ExportConfiguration(password string) (string, error) {
	if a.configManager == nil {
		return "", fmt.Errorf("configuration manager not available")
	}
	
	if password == "" {
		return "", fmt.Errorf("password cannot be empty")
	}
	
	// Get current configuration
	config := a.configManager.GetConfig()
	if config == nil {
		return "", fmt.Errorf("no configuration available")
	}
	
	// Encrypt the configuration
	encryptedData, err := EncryptConfiguration(config, password)
	if err != nil {
		return "", fmt.Errorf("failed to encrypt configuration: %w", err)
	}
	
	// Create suggested filename with timestamp
	timestamp := time.Now().Format("2006-01-02_15-04-05")
	suggestedFilename := fmt.Sprintf("neobelt-config-%s.enc", timestamp)
	
	// Show save file dialog
	options := runtime.SaveDialogOptions{
		Title:           "Export Neobelt Configuration",
		DefaultFilename: suggestedFilename,
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Encrypted Configuration Files (*.enc)",
				Pattern:     "*.enc",
			},
			{
				DisplayName: "All Files (*.*)",
				Pattern:     "*.*",
			},
		},
	}
	
	exportPath, err := runtime.SaveFileDialog(a.ctx, options)
	if err != nil {
		return "", fmt.Errorf("failed to show save dialog: %w", err)
	}
	
	// Check if user cancelled the dialog
	if exportPath == "" {
		return "", fmt.Errorf("export cancelled by user")
	}
	
	// Ensure .enc extension if not provided
	if !strings.HasSuffix(strings.ToLower(exportPath), ".enc") {
		exportPath += ".enc"
	}
	
	// Write encrypted data to the selected file
	if err := os.WriteFile(exportPath, encryptedData, 0600); err != nil {
		return "", fmt.Errorf("failed to write export file: %w", err)
	}
	
	LogInfo("Configuration exported to: %s", exportPath)
	return exportPath, nil
}

// ImportConfiguration imports configuration from encrypted data
func (a *App) ImportConfiguration(encryptedData, password string) error {
	if a.configManager == nil {
		return fmt.Errorf("configuration manager not available")
	}
	
	if encryptedData == "" {
		return fmt.Errorf("encrypted data cannot be empty")
	}
	
	if password == "" {
		return fmt.Errorf("password cannot be empty")
	}
	
	// Decrypt configuration
	config, err := DecryptConfiguration([]byte(encryptedData), password)
	if err != nil {
		return fmt.Errorf("failed to decrypt configuration: %w", err)
	}
	
	// Validate configuration structure
	if config == nil {
		return fmt.Errorf("invalid configuration data")
	}
	
	// Backup current configuration
	currentConfig := a.configManager.GetConfig()
	if currentConfig != nil {
		backupPath := a.configManager.GetConfigPath() + ".backup"
		if backupData, err := json.MarshalIndent(currentConfig, "", "  "); err == nil {
			os.WriteFile(backupPath, backupData, 0600)
			LogInfo("Current configuration backed up to: %s", backupPath)
		}
	}
	
	// Update configuration manager with imported config
	a.configManager.config = config
	
	// Save the imported configuration
	if err := a.configManager.Save(); err != nil {
		return fmt.Errorf("failed to save imported configuration: %w", err)
	}
	
	// Update logger settings if debug mode changed
	if config.App.DebugMode != GetDebugMode() {
		SetDebugMode(config.App.DebugMode)
	}
	
	LogInfo("Configuration imported successfully")
	return nil
}

// SelectImportFile opens a file dialog to select an import file and returns the file content
func (a *App) SelectImportFile() (string, error) {
	// Show open file dialog
	options := runtime.OpenDialogOptions{
		Title: "Import Neobelt Configuration",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Encrypted Configuration Files (*.enc)",
				Pattern:     "*.enc",
			},
			{
				DisplayName: "All Files (*.*)",
				Pattern:     "*.*",
			},
		},
	}
	
	filePath, err := runtime.OpenFileDialog(a.ctx, options)
	if err != nil {
		return "", fmt.Errorf("failed to show open dialog: %w", err)
	}
	
	// Check if user cancelled the dialog
	if filePath == "" {
		return "", fmt.Errorf("import cancelled by user")
	}
	
	// Read the selected file
	fileContent, err := os.ReadFile(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to read selected file: %w", err)
	}
	
	LogInfo("Selected import file: %s", filePath)
	return string(fileContent), nil
}

// GetRecentLogMessages returns the most recent log messages for the dashboard
func (a *App) GetRecentLogMessages(count int) ([]LogMessage, error) {
	if count <= 0 {
		count = 10 // Default to last 10 messages
	}
	if count > 100 {
		count = 100 // Cap at 100 messages
	}
	
	return GetRecentLogMessages(count), nil
}

// JavaScript logging bindings

// JSLogInfo logs an info message from JavaScript
func (a *App) JSLogInfo(message string) {
	LogInfo("[JS] %s", message)
}

// JSLogError logs an error message from JavaScript
func (a *App) JSLogError(message string) {
	LogError("[JS] %s", message)
}

// JSLogDebug logs a debug message from JavaScript
func (a *App) JSLogDebug(message string) {
	LogDebug("[JS] %s", message)
}

// JSLogWarning logs a warning message from JavaScript
func (a *App) JSLogWarning(message string) {
	LogWarning("[JS] %s", message)
}

// JSGetDebugMode returns the current debug mode status for JavaScript
func (a *App) JSGetDebugMode() bool {
	return GetDebugMode()
}

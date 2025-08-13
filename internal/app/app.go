package app

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

	"neobelt/internal/config"
	"neobelt/internal/crypto"
	"neobelt/internal/docker"
	"neobelt/internal/logging"
	"neobelt/internal/version"

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
	configManager *config.ConfigManager
	dockerService *docker.DockerService
	dockerMonitor *DockerMonitor
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// Startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx

	// Initialize configuration manager
	configManager, err := config.NewConfigManager()
	if err != nil {
		logging.LogError("Failed to initialize configuration manager: %v", err)
		// Continue with default behavior if config fails
		return
	}

	a.configManager = configManager
	logging.LogInfo("Configuration loaded from: %s", configManager.GetConfigPath())

	// Initialize logger
	config := configManager.GetConfig()
	debugMode := false
	logRetention := 30
	if config != nil {
		debugMode = config.App.DebugMode
		logRetention = config.App.LogRetention
	}

	logDir := configManager.GetLogDir()
	if err := logging.InitLogger(logDir, debugMode); err != nil {
		fmt.Printf("Warning: Failed to initialize logger: %v\n", err) // Keep as fmt since logger isn't initialized yet
	} else {
		logging.LogInfo("Logger initialized successfully")
		// Clean up old logs
		if err := logging.CleanupOldLogs(logDir, logRetention); err != nil {
			logging.LogWarning("Failed to cleanup old logs: %v", err)
		}
	}

	// Initialize Docker service
	dockerService, err := docker.NewDockerService()
	if err != nil {
		logging.LogWarning("Failed to initialize Docker service: %v", err)
		// Continue without Docker functionality
	} else {
		a.dockerService = dockerService
		logging.LogInfo("Docker service initialized successfully")
	}

	// Initialize and start Docker monitor
	a.dockerMonitor = NewDockerMonitor(a)
	a.dockerMonitor.Start()
	logging.LogInfo("Docker monitor started")
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// FetchOfficialRegistry fetches servers from the official registry
func (a *App) FetchOfficialRegistry() ([]config.RegistryServer, error) {
	return a.fetchRegistryFromURL("https://dennis.paul.hamburg/neobelt/registry.json")
}

// FetchCustomRegistry fetches servers from a custom registry URL
func (a *App) FetchCustomRegistry(url string) ([]config.RegistryServer, error) {
	return a.fetchRegistryFromURLWithAuth(url, config.Registry{AuthType: "none"})
}

// fetchRegistryFromURL is a helper function to fetch registry data from any URL (for official registry)
func (a *App) fetchRegistryFromURL(url string) ([]config.RegistryServer, error) {
	return a.fetchRegistryFromURLWithAuth(url, config.Registry{AuthType: "none"})
}

// fetchRegistryFromURLWithAuth is a helper function to fetch registry data with authentication
func (a *App) fetchRegistryFromURLWithAuth(url string, registry config.Registry) ([]config.RegistryServer, error) {
	// Enforce HTTPS for custom registries (allow HTTP only for official registry)
	if !strings.HasPrefix(url, "https://") {
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

	var servers []config.RegistryServer
	err = json.Unmarshal(body, &servers)
	if err != nil {
		return nil, fmt.Errorf("failed to parse registry JSON: %w", err)
	}

	return servers, nil
}

// GetRegistries returns the list of configured registries with hardcoded official registry
func (a *App) GetRegistries() []config.Registry {
	// Always include the hardcoded official registry
	officialRegistry := config.Registry{
		Name:        "Official Registry",
		URL:         "https://dennis.paul.hamburg/neobelt/registry.json",
		Description: "Handpicked MCP servers by the Neobelt team",
		AuthType:    "none",
	}

	registries := []config.Registry{officialRegistry}

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
	newRegistry := config.Registry{
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
func (a *App) FetchAllRegistries() ([]config.RegistryServer, error) {
	registries := a.GetRegistries()
	var allServers []config.RegistryServer

	for _, registry := range registries {
		servers, err := a.fetchRegistryFromURLWithAuth(registry.URL, registry)
		if err != nil {
			// Log the error but continue with other registries
			logging.LogWarning("Failed to fetch from registry %s: %v", registry.Name, err)
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
	updatedRegistry := config.Registry{
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
func (a *App) GetConfiguration() (*config.Configuration, error) {
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
func (a *App) GetServerDefaults() (*config.ServerDefaultsConfig, error) {
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
func (a *App) UpdateServerDefaults(serverDefaults config.ServerDefaultsConfig) (bool, error) {
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
			logging.LogWarning("Failed to reallocate ports: %v", err)
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
		logging.LogInfo(logMessage)

		if err := a.applySettingsToExistingContainers(serverDefaults); err != nil {
			logging.LogWarning("Failed to apply some settings to existing containers: %v", err)
			// Don't fail the settings update if container updates fail
		}
	} else {
		logging.LogInfo("No container recreation needed - only AutoStart setting changed")
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
				logging.LogWarning("Failed to update container port for %s: %v", server.ContainerID, err)
				// Continue with other servers even if one fails
			}
		}

		nextPort++
		logging.LogInfo("Reallocated port for server %s: %d -> %d", server.Name, oldPort, server.Port)
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

	var containerInfo *docker.ContainerInfo
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
		logging.LogInfo("Container %s is not running (%s), port change will apply on next start", containerID, containerInfo.State)
		return nil
	}

	logging.LogInfo("Recreating container %s to change port mapping: %d -> %d", containerID, oldPort, newPort)

	// Get server defaults for recreation
	serverDefaults, err := a.GetServerDefaults()
	if err != nil {
		return fmt.Errorf("failed to get server defaults: %w", err)
	}

	// Stop the container
	logging.LogInfo("Stopping container %s for port change...", containerID)
	if err := a.dockerService.StopContainer(a.ctx, containerID); err != nil {
		return fmt.Errorf("failed to stop container: %w", err)
	}

	// Get the configured server info to recreate the container
	configuredServers := a.configManager.GetConfiguredServers()
	var configuredServer *config.ConfiguredServer
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
	logging.LogInfo("Removing old container %s...", containerID)
	if err := a.dockerService.RemoveContainer(a.ctx, containerID, true); err != nil {
		return fmt.Errorf("failed to remove old container: %w", err)
	}

	// Create new container with updated port
	newConfig := docker.ContainerCreateConfig{
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

	logging.LogInfo("Creating new container with host port %d and container port %d", newPort, newConfig.ContainerPort)

	newContainerID, err := a.dockerService.CreateContainer(a.ctx, newConfig)
	if err != nil {
		return fmt.Errorf("failed to create new container with new port: %w", err)
	}

	// Update the configured server with the new container ID
	configuredServer.ContainerID = newContainerID
	if err := a.configManager.AddOrUpdateConfiguredServer(*configuredServer); err != nil {
		logging.LogWarning("Failed to update configured server with new container ID: %v", err)
	}

	// Start the new container
	logging.LogInfo("Starting new container %s with port %d...", newContainerID, newPort)
	if err := a.dockerService.StartContainer(a.ctx, newContainerID); err != nil {
		return fmt.Errorf("failed to start new container: %w", err)
	}

	logging.LogInfo("Successfully recreated container with new port: %s -> %s (port %d -> %d)",
		containerID, newContainerID, oldPort, newPort)
	return nil
}

// applySettingsToExistingContainers applies new server defaults to existing containers
func (a *App) applySettingsToExistingContainers(serverDefaults config.ServerDefaultsConfig) error {
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
			logging.LogWarning("Failed to update settings for container %s (%s): %v",
				server.ContainerID, server.Name, err)
			// Continue with other containers
		} else {
			logging.LogInfo("Updated settings for container %s (%s)", server.ContainerID, server.Name)
		}
	}

	return nil
}

// updateContainerSettings updates memory and restart policy for an existing container by recreating it
func (a *App) updateContainerSettings(containerID string, serverDefaults config.ServerDefaultsConfig) error {
	if a.dockerService == nil {
		return fmt.Errorf("docker service not available")
	}

	// Get container information first
	containers, err := a.dockerService.GetManagedContainers(a.ctx)
	if err != nil {
		return fmt.Errorf("failed to get container info: %w", err)
	}

	var containerInfo *docker.ContainerInfo
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
		logging.LogInfo("Container %s is not running (%s), skipping recreation", containerID, containerInfo.State)
		return nil
	}

	logging.LogInfo("Recreating container %s to apply new settings...", containerID)

	// Stop the container
	logging.LogInfo("Stopping container %s...", containerID)
	if err := a.dockerService.StopContainer(a.ctx, containerID); err != nil {
		return fmt.Errorf("failed to stop container: %w", err)
	}

	// Get the configured server info to recreate the container
	configuredServers := a.configManager.GetConfiguredServers()
	var configuredServer *config.ConfiguredServer
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
	logging.LogInfo("Removing old container %s...", containerID)
	if err := a.dockerService.RemoveContainer(a.ctx, containerID, true); err != nil {
		return fmt.Errorf("failed to remove old container: %w", err)
	}

	// Create new container with updated settings
	newConfig := docker.ContainerCreateConfig{
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

	logging.LogInfo("Creating new container with updated settings: Memory=%dMB, RestartPolicy=%s, HostPort=%d, ContainerPort=%d",
		newConfig.MemoryLimitMB, newConfig.RestartPolicy, newConfig.Port, newConfig.ContainerPort)

	newContainerID, err := a.dockerService.CreateContainer(a.ctx, newConfig)
	if err != nil {
		return fmt.Errorf("failed to create new container: %w", err)
	}

	// Update the configured server with the new container ID
	configuredServer.ContainerID = newContainerID
	if err := a.configManager.AddOrUpdateConfiguredServer(*configuredServer); err != nil {
		logging.LogWarning("Failed to update configured server with new container ID: %v", err)
	}

	// Start the new container (respecting auto-start setting would have been applied during original creation)
	logging.LogInfo("Starting new container %s...", newContainerID)
	if err := a.dockerService.StartContainer(a.ctx, newContainerID); err != nil {
		return fmt.Errorf("failed to start new container: %w", err)
	}

	logging.LogInfo("Successfully recreated container: %s -> %s", containerID, newContainerID)
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
func (a *App) GetManagedContainers() ([]docker.ContainerInfo, error) {
	if a.dockerService == nil {
		return nil, fmt.Errorf("docker service not available")
	}

	// Clean up orphaned containers before returning the managed ones
	if err := a.CleanupOrphanedContainers(); err != nil {
		logging.LogWarning("Failed to cleanup orphaned containers: %v", err)
		// Continue even if cleanup fails - we still want to return the current containers
	}

	containers, err := a.dockerService.GetManagedContainers(a.ctx)
	if err != nil {
		logging.LogError("Docker service GetManagedContainers failed: %v", err)
		return nil, err
	}

	// Enrich containers with version information from configured servers
	if a.configManager != nil {
		configuredServers := a.configManager.GetConfiguredServers()

		// Create a map for quick lookup by container ID
		configMap := make(map[string]config.ConfiguredServer)
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
	logging.LogDebug("App.StartContainer called for container: %s", containerID)

	if a.dockerService == nil {
		logging.LogError("Docker service not available")
		return fmt.Errorf("Docker service not available")
	}

	err := a.dockerService.StartContainer(a.ctx, containerID)
	if err != nil {
		logging.LogError("Docker service StartContainer failed for %s: %v", containerID, err)
		return err
	}

	logging.LogDebug("App.StartContainer completed successfully for: %s", containerID)
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

				// Clean up Claude Desktop configuration before removing the server entry
				a.RemoveMCPServerFromClaude(server.ContainerName)

				if removeErr := a.configManager.RemoveConfiguredServer(server.ID); removeErr != nil {
					// Log the error but don't fail the operation
					logging.LogWarning("Failed to remove configured server entry for container %s: %v", containerID, removeErr)
				} else {
					logging.LogInfo("Successfully removed configured server entry for container %s", containerID)
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
	registryMap := make(map[string]config.RegistryServer)
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
func (a *App) CreateContainer(config docker.ContainerCreateConfig) (string, error) {
	logging.LogDebug("App.CreateContainer called with config: %+v", config)

	if a.dockerService == nil {
		logging.LogError("Docker service not available")
		return "", fmt.Errorf("Docker service not available")
	}

	containerId, err := a.dockerService.CreateContainer(a.ctx, config)
	if err != nil {
		logging.LogError("Docker service CreateContainer failed: %v", err)
		return "", err
	}

	logging.LogDebug("App.CreateContainer completed successfully, returning ID: %s", containerId)
	return containerId, nil
}

// InstallServer installs a server from the registry (pulls image and updates config)
func (a *App) InstallServer(server config.RegistryServer) error {
	// Pull the Docker image
	if err := a.PullImage(server.DockerImage); err != nil {
		return fmt.Errorf("failed to pull image %s: %w", server.DockerImage, err)
	}

	// Add server to installed servers configuration
	if a.configManager == nil {
		return fmt.Errorf("configuration manager not available")
	}

	installedServer := config.InstalledServer{
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

// InstallManualServer creates an installed server entry for a manually pulled Docker image
func (a *App) InstallManualServer(dockerImage, name, description string) (string, error) {
	if a.configManager == nil {
		return "", fmt.Errorf("configuration manager not available")
	}

	serverID := fmt.Sprintf("manual-%s-%d", strings.ToLower(strings.ReplaceAll(name, " ", "-")), time.Now().Unix())
	installedServer := config.InstalledServer{
		ID:                   serverID,
		Name:                 name,
		DockerImage:          dockerImage,
		Version:              "latest",
		Description:          description,
		SetupDescription:     fmt.Sprintf("Manually configured Docker container from image %s", dockerImage),
		SupportURL:           "",
		License:              "Unknown",
		Maintainer:           "Custom",
		Tags:                 []string{"manual", "custom"},
		Architecture:         []string{"amd64"},
		HealthCheck:          make(map[string]any),
		ResourceRequirements: make(map[string]any),
		DockerCommand:        "",
		EnvironmentVariables: make(map[string]any),
		Ports:                make(map[string]any),
		Volumes:              []any{},
		InstallDate:          time.Now().Format(time.RFC3339),
		LastUpdated:          time.Now().Format(time.RFC3339),
		SourceRegistry:       "Custom Docker",
		IsOfficial:           false,
	}

	err := a.configManager.AddOrUpdateInstalledServer(installedServer)
	if err != nil {
		return "", err
	}
	return serverID, nil
}

// GetInstalledServers returns all installed servers (those that have images pulled)
func (a *App) GetInstalledServers() ([]config.InstalledServer, error) {
	if a.configManager == nil {
		return nil, fmt.Errorf("configuration manager not available")
	}

	return a.configManager.GetInstalledServers(), nil
}

// GetConfiguredServers returns all configured servers (actual Docker containers)
func (a *App) GetConfiguredServers() ([]config.ConfiguredServer, error) {
	if a.configManager == nil {
		return nil, fmt.Errorf("configuration manager not available")
	}

	return a.configManager.GetConfiguredServers(), nil
}

// getMCPPortFromRegistry extracts the MCP port from registry server data
func getMCPPortFromRegistry(server *config.RegistryServer) int {
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
func getMCPPortFromInstalledServer(server *config.InstalledServer) int {
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

	configuredServer := config.ConfiguredServer{
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

			// Clean up Claude Desktop configuration before removing the server entry
			a.RemoveMCPServerFromClaude(configServer.ContainerName)

			// Remove the configured server entry
			_ = a.configManager.RemoveConfiguredServer(configServer.ID)
		}
	}

	// Remove the Docker image if requested
	if removeImage && a.dockerService != nil {
		if err := a.dockerService.RemoveImage(a.ctx, installedServer.DockerImage, false); err != nil {
			logging.LogWarning("Failed to remove Docker image %s: %v", installedServer.DockerImage, err)
		}
	}

	// Remove the installed server entry
	return a.configManager.RemoveInstalledServer(serverID)
}

// findInstalledServerByID finds an installed server by ID
func (a *App) findInstalledServerByID(id string) *config.InstalledServer {
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
func (a *App) GetOrphanedContainers() ([]docker.ContainerInfo, error) {
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
func (a *App) GetAppConfig() (*config.AppConfig, error) {
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
func (a *App) UpdateAppConfig(appConfig config.AppConfig) error {
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
			logging.LogWarning("Failed to update autostart setting: %v", err)
			// Don't fail the entire config update if autostart fails
		}
	}

	// Check if debug mode changed and update logger
	if oldConfig.DebugMode != appConfig.DebugMode {
		logging.SetDebugMode(appConfig.DebugMode)
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
		logging.LogInfo("Enabling autostart for Neobelt...")
		return app.Enable()
	} else {
		logging.LogInfo("Disabling autostart for Neobelt...")
		return app.Disable()
	}
}

// getExecutablePath returns the path to the current executable
func getExecutablePath() string {
	exec, err := os.Executable()
	if err != nil {
		logging.LogWarning("Could not get executable path: %v", err)
		return "neobelt" // fallback
	}

	// Get absolute path
	absPath, err := filepath.Abs(exec)
	if err != nil {
		logging.LogWarning("Could not get absolute path: %v", err)
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
func (a *App) GetRemoteAccess() (*config.RemoteAccessConfig, error) {
	if a.configManager == nil {
		return nil, fmt.Errorf("configuration manager not available")
	}

	cfg := a.configManager.GetConfig()
	if cfg == nil {
		return &config.RemoteAccessConfig{
			RemoteServer: "remote.neobelt.io",
			Username:     "",
			PrivateKey:   "",
			PublicKey:    "",
			KeyGenerated: false,
		}, nil
	}

	return &cfg.RemoteAccess, nil
}

// UpdateRemoteAccess updates the remote access configuration
func (a *App) UpdateRemoteAccess(remoteAccess config.RemoteAccessConfig) error {
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

// GetClaudeIntegration returns the current Claude integration configuration
func (a *App) GetClaudeIntegration() (*config.ClaudeIntegrationConfig, error) {
	if a.configManager == nil {
		return nil, fmt.Errorf("configuration manager not available")
	}
	cfg := a.configManager.GetConfig()
	if cfg == nil {
		return &config.ClaudeIntegrationConfig{
			Enabled:    false,
			ConfigPath: "",
		}, nil
	}
	return &cfg.ClaudeIntegration, nil
}

// UpdateClaudeIntegration updates the Claude integration configuration
func (a *App) UpdateClaudeIntegration(claudeIntegration config.ClaudeIntegrationConfig) error {
	if a.configManager == nil {
		return fmt.Errorf("configuration manager not available")
	}
	config := a.configManager.GetConfig()
	if config == nil {
		return fmt.Errorf("no configuration loaded")
	}

	// Check if integration is being disabled
	wasEnabled := config.ClaudeIntegration.Enabled
	isBeingDisabled := wasEnabled && !claudeIntegration.Enabled

	// Update the configuration
	config.ClaudeIntegration = claudeIntegration

	// If integration is being disabled, clean up all Neobelt-managed MCP servers
	if isBeingDisabled {
		logging.LogInfo("Claude integration is being disabled, cleaning up all Neobelt-managed MCP servers from Claude configuration")
		a.RemoveAllNeobeltMCPServersFromClaude()
	}

	return a.configManager.Save()
}

// GenerateSSHKeys generates a new SSH key pair for remote access
func (a *App) GenerateSSHKeys() (*crypto.SSHKeyPair, error) {
	if a.configManager == nil {
		return nil, fmt.Errorf("configuration manager not available")
	}

	// Generate new key pair
	keyPair, err := crypto.GenerateSSHKeyPair()
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
		publicKey, err := crypto.GetPublicKeyFromPrivate(config.RemoteAccess.PrivateKey)
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

// DetectClaudeConfig attempts to automatically detect the Claude Desktop configuration file
func (a *App) DetectClaudeConfig() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("failed to get user home directory: %w", err)
	}

	var possiblePaths []string

	// Add platform-specific paths
	possiblePaths = append(possiblePaths,
		filepath.Join(homeDir, "Library", "Application Support", "Claude", "claude_desktop_config.json"), // macOS
		filepath.Join(os.Getenv("APPDATA"), "Claude", "claude_desktop_config.json"),                      // Windows
		filepath.Join(homeDir, ".config", "Claude", "claude_desktop_config.json"),                        // Linux
	)

	// Check each possible path
	for _, path := range possiblePaths {
		if path == "" {
			continue
		}
		if _, err := os.Stat(path); err == nil {
			logging.LogInfo("Found Claude Desktop configuration at: %s", path)
			return path, nil
		}
	}

	return "", fmt.Errorf("Claude Desktop configuration file not found")
}

// TestClaudeConfig tests if the specified Claude configuration file is valid and accessible
func (a *App) TestClaudeConfig(configPath string) (map[string]interface{}, error) {
	if configPath == "" {
		return nil, fmt.Errorf("configuration path is required")
	}

	// Check if file exists and is readable
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("configuration file does not exist: %s", configPath)
	}

	// Try to read and parse the JSON
	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read configuration file: %w", err)
	}

	var config map[string]interface{}
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("invalid JSON in configuration file: %w", err)
	}

	// Count existing MCP servers
	existingServers := 0
	if mcpServers, ok := config["mcpServers"]; ok {
		if servers, ok := mcpServers.(map[string]interface{}); ok {
			existingServers = len(servers)
		}
	}

	return map[string]interface{}{
		"valid":            true,
		"existing_servers": existingServers,
	}, nil
}

// SelectClaudeConfigFile opens a file dialog to select the Claude configuration file
func (a *App) SelectClaudeConfigFile() (string, error) {
	options := runtime.OpenDialogOptions{
		DefaultDirectory: "",
		DefaultFilename:  "claude_desktop_config.json",
		Title:            "Select Claude Desktop Configuration File",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Claude Config (*.json)",
				Pattern:     "*.json",
			},
			{
				DisplayName: "All Files (*.*)",
				Pattern:     "*",
			},
		},
	}

	selectedFile, err := runtime.OpenFileDialog(a.ctx, options)
	if err != nil {
		return "", fmt.Errorf("file selection cancelled by user")
	}

	if selectedFile == "" {
		return "", fmt.Errorf("no file selected")
	}

	return selectedFile, nil
}

// AddMCPServerToClaude adds an MCP server entry to Claude Desktop configuration
func (a *App) AddMCPServerToClaude(containerName string, port int) error {
	// Get Claude integration settings
	claudeConfig, err := a.GetClaudeIntegration()
	if err != nil {
		return fmt.Errorf("failed to get Claude integration settings: %w", err)
	}

	if !claudeConfig.Enabled || claudeConfig.ConfigPath == "" {
		return fmt.Errorf("Claude integration is not enabled or configured")
	}

	// Get the current executable path
	executablePath := getExecutablePath()

	// Read existing Claude configuration
	var config map[string]interface{}
	data, err := os.ReadFile(claudeConfig.ConfigPath)
	if err != nil {
		if os.IsNotExist(err) {
			// Create new config if file doesn't exist
			config = make(map[string]interface{})
		} else {
			return fmt.Errorf("failed to read Claude configuration: %w", err)
		}
	} else {
		if err := json.Unmarshal(data, &config); err != nil {
			return fmt.Errorf("failed to parse Claude configuration: %w", err)
		}
	}

	// Ensure mcpServers section exists
	if _, ok := config["mcpServers"]; !ok {
		config["mcpServers"] = make(map[string]interface{})
	}

	mcpServers, ok := config["mcpServers"].(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid mcpServers section in Claude configuration")
	}

	// Add the new MCP server entry
	mcpServers[containerName] = map[string]interface{}{
		"command": executablePath,
		"args": []string{
			"--mcp-proxy",
			fmt.Sprintf("http://localhost:%d/mcp", port),
		},
	}

	// Write back to file
	updatedData, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal Claude configuration: %w", err)
	}

	// Create directory if it doesn't exist
	if err := os.MkdirAll(filepath.Dir(claudeConfig.ConfigPath), 0755); err != nil {
		return fmt.Errorf("failed to create configuration directory: %w", err)
	}

	if err := os.WriteFile(claudeConfig.ConfigPath, updatedData, 0644); err != nil {
		return fmt.Errorf("failed to write Claude configuration: %w", err)
	}

	logging.LogInfo("Successfully added MCP server '%s' to Claude Desktop configuration", containerName)
	return nil
}

// RemoveMCPServerFromClaude removes an MCP server entry from Claude Desktop configuration
func (a *App) RemoveMCPServerFromClaude(containerName string) error {
	// Get Claude integration settings
	claudeConfig, err := a.GetClaudeIntegration()
	if err != nil {
		logging.LogWarning("Failed to get Claude integration settings for cleanup: %v", err)
		return nil // Don't fail the main operation
	}

	if !claudeConfig.Enabled || claudeConfig.ConfigPath == "" {
		logging.LogDebug("Claude integration not enabled or configured, skipping cleanup")
		return nil
	}

	// Read existing Claude configuration
	data, err := os.ReadFile(claudeConfig.ConfigPath)
	if err != nil {
		if os.IsNotExist(err) {
			logging.LogDebug("Claude configuration file does not exist, nothing to clean up")
			return nil
		}
		logging.LogWarning("Failed to read Claude configuration for cleanup: %v", err)
		return nil // Don't fail the main operation
	}

	var config map[string]interface{}
	if err := json.Unmarshal(data, &config); err != nil {
		logging.LogWarning("Failed to parse Claude configuration for cleanup: %v", err)
		return nil // Don't fail the main operation
	}

	// Check if mcpServers section exists
	mcpServers, ok := config["mcpServers"].(map[string]interface{})
	if !ok {
		logging.LogDebug("No mcpServers section found in Claude configuration")
		return nil
	}

	// Check if our server exists in the configuration
	if _, exists := mcpServers[containerName]; !exists {
		logging.LogDebug("MCP server '%s' not found in Claude configuration", containerName)
		return nil
	}

	// Remove the server entry
	delete(mcpServers, containerName)
	logging.LogInfo("Removed MCP server '%s' from Claude Desktop configuration", containerName)

	// If mcpServers is now empty, we can keep it as an empty object
	// This maintains the structure for future additions

	// Write back to file
	updatedData, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		logging.LogWarning("Failed to marshal Claude configuration after cleanup: %v", err)
		return nil // Don't fail the main operation
	}

	if err := os.WriteFile(claudeConfig.ConfigPath, updatedData, 0644); err != nil {
		logging.LogWarning("Failed to write Claude configuration after cleanup: %v", err)
		return nil // Don't fail the main operation
	}

	logging.LogInfo("Successfully cleaned up Claude Desktop configuration for server '%s'", containerName)
	return nil
}

// RemoveAllNeobeltMCPServersFromClaude removes all Neobelt-managed MCP servers from Claude Desktop configuration
func (a *App) RemoveAllNeobeltMCPServersFromClaude() error {
	// Get Claude integration settings
	claudeConfig, err := a.GetClaudeIntegration()
	if err != nil {
		logging.LogWarning("Failed to get Claude integration settings for bulk cleanup: %v", err)
		return nil // Don't fail the operation
	}

	if claudeConfig.ConfigPath == "" {
		logging.LogDebug("No Claude configuration path specified, skipping bulk cleanup")
		return nil
	}

	// Read existing Claude configuration
	data, err := os.ReadFile(claudeConfig.ConfigPath)
	if err != nil {
		if os.IsNotExist(err) {
			logging.LogDebug("Claude configuration file does not exist, nothing to clean up")
			return nil
		}
		logging.LogWarning("Failed to read Claude configuration for bulk cleanup: %v", err)
		return nil // Don't fail the operation
	}

	var config map[string]interface{}
	if err := json.Unmarshal(data, &config); err != nil {
		logging.LogWarning("Failed to parse Claude configuration for bulk cleanup: %v", err)
		return nil // Don't fail the operation
	}

	// Check if mcpServers section exists
	mcpServers, ok := config["mcpServers"].(map[string]interface{})
	if !ok {
		logging.LogDebug("No mcpServers section found in Claude configuration")
		return nil
	}

	// Get our executable path to identify Neobelt-managed servers
	executablePath := getExecutablePath()
	var removedServers []string

	// Find and collect all Neobelt-managed MCP servers
	for serverName, serverConfig := range mcpServers {
		if serverConfigMap, ok := serverConfig.(map[string]interface{}); ok {
			if command, ok := serverConfigMap["command"].(string); ok {
				// Check if this server is managed by our binary
				if command == executablePath {
					// Also check if it has the --mcp-proxy argument to be sure
					if argsInterface, hasArgs := serverConfigMap["args"]; hasArgs {
						if args, isArray := argsInterface.([]interface{}); isArray && len(args) > 0 {
							if firstArg, isString := args[0].(string); isString && firstArg == "--mcp-proxy" {
								removedServers = append(removedServers, serverName)
							}
						}
					}
				}
			}
		}
	}

	// Remove all identified Neobelt-managed servers
	for _, serverName := range removedServers {
		delete(mcpServers, serverName)
		logging.LogInfo("Removed Neobelt-managed MCP server '%s' from Claude configuration during bulk cleanup", serverName)
	}

	if len(removedServers) == 0 {
		logging.LogInfo("No Neobelt-managed MCP servers found in Claude configuration")
		return nil
	}

	// Write back to file
	updatedData, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		logging.LogWarning("Failed to marshal Claude configuration after bulk cleanup: %v", err)
		return nil // Don't fail the operation
	}

	if err := os.WriteFile(claudeConfig.ConfigPath, updatedData, 0644); err != nil {
		logging.LogWarning("Failed to write Claude configuration after bulk cleanup: %v", err)
		return nil // Don't fail the operation
	}

	logging.LogInfo("Successfully removed %d Neobelt-managed MCP servers from Claude Desktop configuration", len(removedServers))
	return nil
}

// CleanupClaudeConfiguration manually removes all Neobelt-managed MCP servers from Claude Desktop configuration
func (a *App) CleanupClaudeConfiguration() error {
	logging.LogInfo("Manual Claude configuration cleanup requested")
	return a.RemoveAllNeobeltMCPServersFromClaude()
}

// CheckDockerStatus checks the current status of Docker daemon and Docker Desktop installation
func (a *App) CheckDockerStatus() (*docker.DockerStatus, error) {
	if a.dockerService == nil {
		return &docker.DockerStatus{
			IsRunning:                false,
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

	// Check immediately on start after a short delay to allow frontend initialization
	go func() {
		// Wait 2 seconds for frontend to be ready
		time.Sleep(2 * time.Second)
		dm.checkDockerStatus()
	}()

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
		logging.LogError("Failed to check Docker status: %v", err)
		return
	}

	if !status.IsDockerDesktopInstalled {
		// Docker Desktop is not installed - emit event to show modal
		dm.emitDockerStatusEvent("docker_not_installed", status)
		return
	}

	if !status.IsRunning {
		// Docker is installed but not running - show modal to ask user to start it
		logging.LogInfo("Docker is not running, showing modal to user...")
		dm.emitDockerStatusEvent("docker_not_running", status)
		return
	}

	// Docker is running - emit success event
	dm.emitDockerStatusEvent("docker_running", status)
}

// emitDockerStatusEvent sends Docker status events to the frontend
func (dm *DockerMonitor) emitDockerStatusEvent(eventType string, status *docker.DockerStatus) {
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
				logging.LogWarning("Failed to remove log file %s: %v", logPath, err)
			} else {
				logging.LogInfo("Removed log file: %s", entry.Name())
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
	encryptedData, err := crypto.EncryptConfiguration(config, password)
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

	logging.LogInfo("Configuration exported to: %s", exportPath)
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
	config, err := crypto.DecryptConfiguration([]byte(encryptedData), password)
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
			logging.LogInfo("Current configuration backed up to: %s", backupPath)
		}
	}

	// Update configuration manager with imported config
	a.configManager.SetConfig(config)

	// Save the imported configuration
	if err := a.configManager.Save(); err != nil {
		return fmt.Errorf("failed to save imported configuration: %w", err)
	}

	// Update logger settings if debug mode changed
	if config.App.DebugMode != logging.GetDebugMode() {
		logging.SetDebugMode(config.App.DebugMode)
	}

	logging.LogInfo("Configuration imported successfully")
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

	logging.LogInfo("Selected import file: %s", filePath)
	return string(fileContent), nil
}

// GetRecentLogMessages returns the most recent log messages for the dashboard
func (a *App) GetRecentLogMessages(count int) ([]logging.LogMessage, error) {
	if count <= 0 {
		count = 10 // Default to last 10 messages
	}
	if count > 100 {
		count = 100 // Cap at 100 messages
	}

	return logging.GetRecentLogMessages(count), nil
}

// JavaScript logging bindings

// JSLogInfo logs an info message from JavaScript
func (a *App) JSLogInfo(message string) {
	logging.LogInfo("[JS] %s", message)
}

// JSLogError logs an error message from JavaScript
func (a *App) JSLogError(message string) {
	logging.LogError("[JS] %s", message)
}

// JSLogDebug logs a debug message from JavaScript
func (a *App) JSLogDebug(message string) {
	logging.LogDebug("[JS] %s", message)
}

// JSLogWarning logs a warning message from JavaScript
func (a *App) JSLogWarning(message string) {
	logging.LogWarning("[JS] %s", message)
}

// JSGetDebugMode returns the current debug mode status for JavaScript
func (a *App) JSGetDebugMode() bool {
	return logging.GetDebugMode()
}

// GetAppVersion returns version information for the application
func (a *App) GetAppVersion() map[string]string {
	return version.GetVersionInfo()
}

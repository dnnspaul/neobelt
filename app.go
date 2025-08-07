package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"
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
		fmt.Printf("Failed to initialize configuration manager: %v\n", err)
		// Continue with default behavior if config fails
		return
	}

	a.configManager = configManager
	fmt.Printf("Configuration loaded from: %s\n", configManager.GetConfigPath())

	// Initialize Docker service
	dockerService, err := NewDockerService()
	if err != nil {
		fmt.Printf("Warning: Failed to initialize Docker service: %v\n", err)
		// Continue without Docker functionality
	} else {
		a.dockerService = dockerService
		fmt.Println("Docker service initialized successfully")
	}
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
			fmt.Printf("Warning: Failed to fetch from registry %s: %v\n", registry.Name, err)
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

// UpdateServerDefaults updates the server default settings
func (a *App) UpdateServerDefaults(serverDefaults ServerDefaultsConfig) error {
	if a.configManager == nil {
		return fmt.Errorf("configuration manager not available")
	}

	config := a.configManager.GetConfig()
	if config == nil {
		return fmt.Errorf("no configuration available")
	}

	// Check if port range changed and needs reallocation
	oldDefaultPort := config.ServerDefaults.DefaultPort
	portChanged := oldDefaultPort != serverDefaults.DefaultPort

	config.ServerDefaults = serverDefaults

	// Save configuration first
	if err := a.configManager.Save(); err != nil {
		return err
	}

	// If port range changed, reallocate ports for existing servers
	if portChanged {
		if err := a.reallocatePorts(serverDefaults.DefaultPort); err != nil {
			fmt.Printf("Warning: Failed to reallocate ports: %v\n", err)
			// Don't fail the settings update if port reallocation fails
		}
	}

	// Apply new memory limits and restart policies to existing containers
	if err := a.applySettingsToExistingContainers(serverDefaults); err != nil {
		fmt.Printf("Warning: Failed to apply some settings to existing containers: %v\n", err)
		// Don't fail the settings update if container updates fail
	}

	return nil
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
				fmt.Printf("Warning: Failed to update container port for %s: %v\n", server.ContainerID, err)
				// Continue with other servers even if one fails
			}
		}

		nextPort++
		fmt.Printf("Reallocated port for server %s: %d -> %d\n", server.Name, oldPort, server.Port)
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
		fmt.Printf("Container %s is not running (%s), port change will apply on next start\n", containerID, containerInfo.State)
		return nil
	}

	fmt.Printf("Recreating container %s to change port mapping: %d -> %d\n", containerID, oldPort, newPort)

	// Get server defaults for recreation
	serverDefaults, err := a.GetServerDefaults()
	if err != nil {
		return fmt.Errorf("failed to get server defaults: %w", err)
	}

	// Stop the container
	fmt.Printf("Stopping container %s for port change...\n", containerID)
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
	fmt.Printf("Removing old container %s...\n", containerID)
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

	fmt.Printf("Creating new container with host port %d and container port %d\n", newPort, newConfig.ContainerPort)

	newContainerID, err := a.dockerService.CreateContainer(a.ctx, newConfig)
	if err != nil {
		return fmt.Errorf("failed to create new container with new port: %w", err)
	}

	// Update the configured server with the new container ID
	configuredServer.ContainerID = newContainerID
	if err := a.configManager.AddOrUpdateConfiguredServer(*configuredServer); err != nil {
		fmt.Printf("Warning: Failed to update configured server with new container ID: %v\n", err)
	}

	// Start the new container
	fmt.Printf("Starting new container %s with port %d...\n", newContainerID, newPort)
	if err := a.dockerService.StartContainer(a.ctx, newContainerID); err != nil {
		return fmt.Errorf("failed to start new container: %w", err)
	}

	fmt.Printf("Successfully recreated container with new port: %s -> %s (port %d -> %d)\n",
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
			fmt.Printf("Warning: Failed to update settings for container %s (%s): %v\n",
				server.ContainerID, server.Name, err)
			// Continue with other containers
		} else {
			fmt.Printf("Updated settings for container %s (%s)\n", server.ContainerID, server.Name)
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
		fmt.Printf("Container %s is not running (%s), skipping recreation\n", containerID, containerInfo.State)
		return nil
	}

	fmt.Printf("Recreating container %s to apply new settings...\n", containerID)

	// Stop the container
	fmt.Printf("Stopping container %s...\n", containerID)
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
	fmt.Printf("Removing old container %s...\n", containerID)
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

	fmt.Printf("Creating new container with updated settings: Memory=%dMB, RestartPolicy=%s, HostPort=%d, ContainerPort=%d\n",
		newConfig.MemoryLimitMB, newConfig.RestartPolicy, newConfig.Port, newConfig.ContainerPort)

	newContainerID, err := a.dockerService.CreateContainer(a.ctx, newConfig)
	if err != nil {
		return fmt.Errorf("failed to create new container: %w", err)
	}

	// Update the configured server with the new container ID
	configuredServer.ContainerID = newContainerID
	if err := a.configManager.AddOrUpdateConfiguredServer(*configuredServer); err != nil {
		fmt.Printf("Warning: Failed to update configured server with new container ID: %v\n", err)
	}

	// Start the new container (respecting auto-start setting would have been applied during original creation)
	fmt.Printf("Starting new container %s...\n", newContainerID)
	if err := a.dockerService.StartContainer(a.ctx, newContainerID); err != nil {
		return fmt.Errorf("failed to start new container: %w", err)
	}

	fmt.Printf("Successfully recreated container: %s -> %s\n", containerID, newContainerID)
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
		fmt.Printf("[WARNING] Failed to cleanup orphaned containers: %v\n", err)
		// Continue even if cleanup fails - we still want to return the current containers
	}

	containers, err := a.dockerService.GetManagedContainers(a.ctx)
	if err != nil {
		fmt.Printf("[ERROR] Docker service GetManagedContainers failed: %v\n", err)
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
	fmt.Printf("[DEBUG] App.StartContainer called for container: %s\n", containerID)

	if a.dockerService == nil {
		fmt.Printf("[ERROR] Docker service not available\n")
		return fmt.Errorf("Docker service not available")
	}

	err := a.dockerService.StartContainer(a.ctx, containerID)
	if err != nil {
		fmt.Printf("[ERROR] Docker service StartContainer failed for %s: %v\n", containerID, err)
		return err
	}

	fmt.Printf("[DEBUG] App.StartContainer completed successfully for: %s\n", containerID)
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
					fmt.Printf("Warning: Failed to remove configured server entry for container %s: %v\n", containerID, removeErr)
				} else {
					fmt.Printf("Successfully removed configured server entry for container %s\n", containerID)
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
	fmt.Printf("[DEBUG] App.CreateContainer called with config: %+v\n", config)

	if a.dockerService == nil {
		fmt.Printf("[ERROR] Docker service not available\n")
		return "", fmt.Errorf("Docker service not available")
	}

	containerId, err := a.dockerService.CreateContainer(a.ctx, config)
	if err != nil {
		fmt.Printf("[ERROR] Docker service CreateContainer failed: %v\n", err)
		return "", err
	}

	fmt.Printf("[DEBUG] App.CreateContainer completed successfully, returning ID: %s\n", containerId)
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
			fmt.Printf("Warning: Failed to remove Docker image %s: %v\n", installedServer.DockerImage, err)
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

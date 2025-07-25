package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

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
	Name                 string                 `json:"name"`
	Description          string                 `json:"description"`
	SetupDescription     string                 `json:"setup_description"`
	SupportURL           string                 `json:"support_url"`
	DockerImage          string                 `json:"docker_image"`
	Version              string                 `json:"version"`
	License              string                 `json:"license"`
	Maintainer           string                 `json:"maintainer"`
	Tags                 []string               `json:"tags"`
	Architecture         []string          `json:"architecture"`
	HealthCheck          map[string]any    `json:"health_check"`
	ResourceRequirements map[string]any    `json:"resource_requirements"`
	DockerCommand        string            `json:"docker_command"`
	EnvironmentVariables map[string]any    `json:"environment_variables"`
	Ports                map[string]any    `json:"ports"`
	Volumes              []any             `json:"volumes"`
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

// Docker API methods

// GetManagedContainers returns all Docker containers managed by neobelt
func (a *App) GetManagedContainers() ([]ContainerInfo, error) {
	if a.dockerService == nil {
		return nil, fmt.Errorf("Docker service not available")
	}

	return a.dockerService.GetManagedContainers(a.ctx)
}

// StartContainer starts a Docker container
func (a *App) StartContainer(containerID string) error {
	if a.dockerService == nil {
		return fmt.Errorf("Docker service not available")
	}

	return a.dockerService.StartContainer(a.ctx, containerID)
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
			if server.ContainerID == containerID {
				if removeErr := a.configManager.RemoveConfiguredServer(server.ID); removeErr != nil {
					// Log the error but don't fail the operation
					fmt.Printf("Warning: Failed to remove configured server entry for container %s: %v\n", containerID, removeErr)
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
				"installed_server":  server,
				"update_available":  false,
				"latest_version":    "",
				"registry_error":    err.Error(),
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
	if a.dockerService == nil {
		return "", fmt.Errorf("Docker service not available")
	}

	return a.dockerService.CreateContainer(a.ctx, config)
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

	configuredServer := ConfiguredServer{
		ID:                fmt.Sprintf("configured-%d", time.Now().Unix()),
		Name:              installedServer.Name,
		ContainerName:     containerName,
		ContainerID:       containerID,
		InstalledServerID: installedServerID,
		DockerImage:       installedServer.DockerImage,
		Port:              port,
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

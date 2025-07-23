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
	Architecture         []string               `json:"architecture"`
	HealthCheck          map[string]interface{} `json:"health_check"`
	ResourceRequirements map[string]interface{} `json:"resource_requirements"`
	DockerCommand        string                 `json:"docker_command"`
	EnvironmentVariables map[string]interface{} `json:"environment_variables"`
	Ports                map[string]interface{} `json:"ports"`
	Volumes              []interface{}          `json:"volumes"`
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

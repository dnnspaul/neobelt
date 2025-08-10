package main

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/viper"
)

// Configuration represents the application configuration
type Configuration struct {
	App               AppConfig            `json:"app" mapstructure:"app"`
	ServerDefaults    ServerDefaultsConfig `json:"server_defaults" mapstructure:"server_defaults"`
	RemoteAccess      RemoteAccessConfig   `json:"remote_access" mapstructure:"remote_access"`
	Registries        []Registry           `json:"registries" mapstructure:"registries"`
	InstalledServers  []InstalledServer    `json:"installed_servers" mapstructure:"installed_servers"`
	ConfiguredServers []ConfiguredServer   `json:"configured_servers" mapstructure:"configured_servers"`
}

// AppConfig contains general application settings
type AppConfig struct {
	Version         string `json:"version" mapstructure:"version"`
	Theme           string `json:"theme" mapstructure:"theme"`
	AutoRefresh     bool   `json:"auto_refresh" mapstructure:"auto_refresh"`
	RefreshInterval int    `json:"refresh_interval" mapstructure:"refresh_interval"` // minutes
	CheckForUpdates bool   `json:"check_for_updates" mapstructure:"check_for_updates"`
	StartupPage     string `json:"startup_page" mapstructure:"startup_page"`
	AutoStart       bool   `json:"auto_start" mapstructure:"auto_start"`
	DebugMode       bool   `json:"debug_mode" mapstructure:"debug_mode"`
	LogRetention    int    `json:"log_retention" mapstructure:"log_retention"` // days
}

// ServerDefaultsConfig contains default settings for new servers
type ServerDefaultsConfig struct {
	AutoStart        bool `json:"auto_start" mapstructure:"auto_start"`
	DefaultPort      int  `json:"default_port" mapstructure:"default_port"`
	MaxMemoryMB      int  `json:"max_memory_mb" mapstructure:"max_memory_mb"`
	RestartOnFailure bool `json:"restart_on_failure" mapstructure:"restart_on_failure"`
}

// RemoteAccessConfig contains remote access settings
type RemoteAccessConfig struct {
	RemoteServer   string `json:"remote_server" mapstructure:"remote_server"`
	Username       string `json:"username" mapstructure:"username"`
	PrivateKey     string `json:"private_key" mapstructure:"private_key"`
	PublicKey      string `json:"public_key" mapstructure:"public_key"`
	KeyGenerated   bool   `json:"key_generated" mapstructure:"key_generated"`
}

// InstalledServer represents a server that has been installed (Docker image pulled)
type InstalledServer struct {
	ID                   string         `json:"id" mapstructure:"id"`
	Name                 string         `json:"name" mapstructure:"name"`
	DockerImage          string         `json:"docker_image" mapstructure:"docker_image"`
	Version              string         `json:"version" mapstructure:"version"`
	Description          string         `json:"description" mapstructure:"description"`
	SetupDescription     string         `json:"setup_description" mapstructure:"setup_description"`
	SupportURL           string         `json:"support_url" mapstructure:"support_url"`
	License              string         `json:"license" mapstructure:"license"`
	Maintainer           string         `json:"maintainer" mapstructure:"maintainer"`
	Tags                 []string       `json:"tags" mapstructure:"tags"`
	Architecture         []string       `json:"architecture" mapstructure:"architecture"`
	HealthCheck          map[string]any `json:"health_check" mapstructure:"health_check"`
	ResourceRequirements map[string]any `json:"resource_requirements" mapstructure:"resource_requirements"`
	DockerCommand        string         `json:"docker_command" mapstructure:"docker_command"`
	EnvironmentVariables map[string]any `json:"environment_variables" mapstructure:"environment_variables"`
	Ports                map[string]any `json:"ports" mapstructure:"ports"`
	Volumes              []any          `json:"volumes" mapstructure:"volumes"`
	InstallDate          string         `json:"install_date" mapstructure:"install_date"`
	LastUpdated          string         `json:"last_updated" mapstructure:"last_updated"`
	SourceRegistry       string         `json:"source_registry" mapstructure:"source_registry"`
	IsOfficial           bool           `json:"is_official" mapstructure:"is_official"`
}

// ConfiguredServer represents an actual Docker container configuration
type ConfiguredServer struct {
	ID                string            `json:"id" mapstructure:"id"`
	Version           string            `json:"version" mapstructure:"version"`
	Name              string            `json:"name" mapstructure:"name"`
	ContainerName     string            `json:"container_name" mapstructure:"container_name"`
	ContainerID       string            `json:"container_id" mapstructure:"container_id"`
	InstalledServerID string            `json:"installed_server_id" mapstructure:"installed_server_id"`
	DockerImage       string            `json:"docker_image" mapstructure:"docker_image"`
	DockerCommand     string            `json:"docker_command" mapstructure:"docker_command"`
	Port              int               `json:"port" mapstructure:"port"`
	ContainerPort     int               `json:"container_port" mapstructure:"container_port"` // MCP port from registry
	Environment       map[string]string `json:"environment" mapstructure:"environment"`
	Volumes           map[string]string `json:"volumes" mapstructure:"volumes"`
	CreatedDate       string            `json:"created_date" mapstructure:"created_date"`
	LastStarted       string            `json:"last_started" mapstructure:"last_started"`
	AutoStart         bool              `json:"auto_start" mapstructure:"auto_start"`
}

// ConfigManager handles configuration persistence
type ConfigManager struct {
	viper      *viper.Viper
	configPath string
	config     *Configuration
}

// NewConfigManager creates a new configuration manager
func NewConfigManager() (*ConfigManager, error) {
	// Get user config directory
	configDir, err := os.UserConfigDir()
	if err != nil {
		return nil, fmt.Errorf("failed to get user config directory: %w", err)
	}

	// Create neobelt config directory
	neobeltConfigDir := filepath.Join(configDir, "neobelt")
	if err := os.MkdirAll(neobeltConfigDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create config directory: %w", err)
	}

	// Create logs directory
	logsDir := filepath.Join(neobeltConfigDir, "logs")
	if err := os.MkdirAll(logsDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create logs directory: %w", err)
	}

	configPath := filepath.Join(neobeltConfigDir, "config.json")

	// Initialize viper
	v := viper.New()
	v.SetConfigName("config")
	v.SetConfigType("json")
	v.AddConfigPath(neobeltConfigDir)

	// Set default values
	v.SetDefault("app.version", "1.0.0")
	v.SetDefault("app.theme", "light")
	v.SetDefault("app.auto_refresh", true)
	v.SetDefault("app.refresh_interval", 5)
	v.SetDefault("app.check_for_updates", true)
	v.SetDefault("app.startup_page", "dashboard")
	v.SetDefault("app.auto_start", false)
	v.SetDefault("app.debug_mode", false)
	v.SetDefault("app.log_retention", 30)
	v.SetDefault("server_defaults.auto_start", false)
	v.SetDefault("server_defaults.default_port", 8000)
	v.SetDefault("server_defaults.max_memory_mb", 512)
	v.SetDefault("server_defaults.restart_on_failure", true)
	v.SetDefault("remote_access.remote_server", "remote.neobelt.io")
	v.SetDefault("remote_access.username", "")
	v.SetDefault("remote_access.private_key", "")
	v.SetDefault("remote_access.public_key", "")
	v.SetDefault("remote_access.key_generated", false)
	v.SetDefault("registries", []Registry{})
	v.SetDefault("installed_servers", []InstalledServer{})
	v.SetDefault("configured_servers", []ConfiguredServer{})

	cm := &ConfigManager{
		viper:      v,
		configPath: configPath,
	}

	// Load or create configuration
	if err := cm.Load(); err != nil {
		return nil, fmt.Errorf("failed to load configuration: %w", err)
	}

	return cm, nil
}

// Load loads the configuration from file or creates default if it doesn't exist
func (cm *ConfigManager) Load() error {
	// Try to read existing config
	if err := cm.viper.ReadInConfig(); err != nil {
		// If config file doesn't exist, create it with defaults
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			fmt.Printf("Config file not found, creating default configuration at: %s\n", cm.configPath) // Keep as fmt since logger isn't initialized yet
			if err := cm.Save(); err != nil {
				return fmt.Errorf("failed to create default config: %w", err)
			}
		} else {
			return fmt.Errorf("failed to read config file: %w", err)
		}
	}

	// Unmarshal configuration
	cm.config = &Configuration{}
	if err := cm.viper.Unmarshal(cm.config); err != nil {
		return fmt.Errorf("failed to unmarshal configuration: %w", err)
	}

	return nil
}

// Save saves the current configuration to file
func (cm *ConfigManager) Save() error {
	// Update viper with current config
	if cm.config != nil {
		cm.viper.Set("app", cm.config.App)
		cm.viper.Set("server_defaults", cm.config.ServerDefaults)
		cm.viper.Set("remote_access", cm.config.RemoteAccess)
		cm.viper.Set("registries", cm.config.Registries)
		cm.viper.Set("installed_servers", cm.config.InstalledServers)
		cm.viper.Set("configured_servers", cm.config.ConfiguredServers)
	}

	// Write to file
	if err := cm.viper.WriteConfigAs(cm.configPath); err != nil {
		return fmt.Errorf("failed to write config file: %w", err)
	}

	return nil
}

// GetConfig returns the current configuration
func (cm *ConfigManager) GetConfig() *Configuration {
	return cm.config
}

// GetRegistries returns all configured registries
func (cm *ConfigManager) GetRegistries() []Registry {
	if cm.config == nil {
		return []Registry{}
	}
	return cm.config.Registries
}

// AddRegistry adds a new registry to the configuration
func (cm *ConfigManager) AddRegistry(registry Registry) error {
	if cm.config == nil {
		cm.config = &Configuration{}
	}

	// Check if registry already exists
	for _, existing := range cm.config.Registries {
		if existing.URL == registry.URL {
			return fmt.Errorf("registry with URL %s already exists", registry.URL)
		}
	}

	// Add registry
	cm.config.Registries = append(cm.config.Registries, registry)

	// Save configuration
	return cm.Save()
}

// RemoveRegistry removes a registry from the configuration
func (cm *ConfigManager) RemoveRegistry(url string) error {
	if cm.config == nil {
		return fmt.Errorf("no configuration loaded")
	}

	// Find and remove registry
	for i, registry := range cm.config.Registries {
		if registry.URL == url {
			// Remove registry
			cm.config.Registries = append(cm.config.Registries[:i], cm.config.Registries[i+1:]...)

			// Save configuration
			return cm.Save()
		}
	}

	return fmt.Errorf("registry with URL %s not found", url)
}

// UpdateRegistry updates an existing registry
func (cm *ConfigManager) UpdateRegistry(oldURL string, newRegistry Registry) error {
	if cm.config == nil {
		return fmt.Errorf("no configuration loaded")
	}

	// Find and update registry
	for i, registry := range cm.config.Registries {
		if registry.URL == oldURL {
			// Update registry
			cm.config.Registries[i] = newRegistry

			// Save configuration
			return cm.Save()
		}
	}

	return fmt.Errorf("registry with URL %s not found", oldURL)
}

// GetInstalledServers returns all installed servers
func (cm *ConfigManager) GetInstalledServers() []InstalledServer {
	if cm.config == nil {
		return []InstalledServer{}
	}
	return cm.config.InstalledServers
}

// GetConfiguredServers returns all configured servers
func (cm *ConfigManager) GetConfiguredServers() []ConfiguredServer {
	if cm.config == nil {
		return []ConfiguredServer{}
	}
	return cm.config.ConfiguredServers
}

// AddOrUpdateInstalledServer adds or updates an installed server
func (cm *ConfigManager) AddOrUpdateInstalledServer(server InstalledServer) error {
	if cm.config == nil {
		cm.config = &Configuration{}
	}

	// Find existing server
	for i, existing := range cm.config.InstalledServers {
		if existing.ID == server.ID {
			// Update existing server
			cm.config.InstalledServers[i] = server
			return cm.Save()
		}
	}

	// Add new server
	cm.config.InstalledServers = append(cm.config.InstalledServers, server)
	return cm.Save()
}

// AddOrUpdateConfiguredServer adds or updates a configured server
func (cm *ConfigManager) AddOrUpdateConfiguredServer(server ConfiguredServer) error {
	if cm.config == nil {
		cm.config = &Configuration{}
	}

	// Find existing server
	for i, existing := range cm.config.ConfiguredServers {
		if existing.ID == server.ID {
			// Update existing server
			cm.config.ConfiguredServers[i] = server
			return cm.Save()
		}
	}

	// Add new server
	cm.config.ConfiguredServers = append(cm.config.ConfiguredServers, server)
	return cm.Save()
}

// RemoveInstalledServer removes an installed server from the configuration
func (cm *ConfigManager) RemoveInstalledServer(serverID string) error {
	if cm.config == nil {
		return fmt.Errorf("no configuration loaded")
	}

	// Find and remove server
	for i, server := range cm.config.InstalledServers {
		if server.ID == serverID {
			cm.config.InstalledServers = append(cm.config.InstalledServers[:i], cm.config.InstalledServers[i+1:]...)
			return cm.Save()
		}
	}

	return fmt.Errorf("installed server with ID %s not found", serverID)
}

// RemoveConfiguredServer removes a configured server from the configuration
func (cm *ConfigManager) RemoveConfiguredServer(serverID string) error {
	if cm.config == nil {
		return fmt.Errorf("no configuration loaded")
	}

	// Find and remove server
	for i, server := range cm.config.ConfiguredServers {
		if server.ID == serverID {
			cm.config.ConfiguredServers = append(cm.config.ConfiguredServers[:i], cm.config.ConfiguredServers[i+1:]...)
			return cm.Save()
		}
	}

	return fmt.Errorf("configured server with ID %s not found", serverID)
}

// GetConfigPath returns the path to the configuration file
func (cm *ConfigManager) GetConfigPath() string {
	return cm.configPath
}

// GetLogDir returns the path to the logs directory
func (cm *ConfigManager) GetLogDir() string {
	configDir := filepath.Dir(cm.configPath)
	return filepath.Join(configDir, "logs")
}

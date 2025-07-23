package main

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/viper"
)

// Configuration represents the application configuration
type Configuration struct {
	App        AppConfig      `json:"app" mapstructure:"app"`
	Registries []Registry     `json:"registries" mapstructure:"registries"`
	Servers    []ServerConfig `json:"servers" mapstructure:"servers"`
}

// AppConfig contains general application settings
type AppConfig struct {
	Version         string `json:"version" mapstructure:"version"`
	Theme           string `json:"theme" mapstructure:"theme"`
	AutoRefresh     bool   `json:"auto_refresh" mapstructure:"auto_refresh"`
	RefreshInterval int    `json:"refresh_interval" mapstructure:"refresh_interval"` // minutes
	CheckForUpdates bool   `json:"check_for_updates" mapstructure:"check_for_updates"`
}

// ServerConfig contains configuration for installed servers
type ServerConfig struct {
	ID          string            `json:"id" mapstructure:"id"`
	Name        string            `json:"name" mapstructure:"name"`
	DockerImage string            `json:"docker_image" mapstructure:"docker_image"`
	Version     string            `json:"version" mapstructure:"version"`
	Installed   bool              `json:"installed" mapstructure:"installed"`
	Running     bool              `json:"running" mapstructure:"running"`
	Port        int               `json:"port" mapstructure:"port"`
	Environment map[string]string `json:"environment" mapstructure:"environment"`
	InstallDate string            `json:"install_date" mapstructure:"install_date"`
	LastUpdated string            `json:"last_updated" mapstructure:"last_updated"`
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
	v.SetDefault("registries", []Registry{})
	v.SetDefault("servers", []ServerConfig{})

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
			fmt.Printf("Config file not found, creating default configuration at: %s\n", cm.configPath)
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
		cm.viper.Set("registries", cm.config.Registries)
		cm.viper.Set("servers", cm.config.Servers)
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

// GetServers returns all configured servers
func (cm *ConfigManager) GetServers() []ServerConfig {
	if cm.config == nil {
		return []ServerConfig{}
	}
	return cm.config.Servers
}

// AddOrUpdateServer adds or updates a server configuration
func (cm *ConfigManager) AddOrUpdateServer(server ServerConfig) error {
	if cm.config == nil {
		cm.config = &Configuration{}
	}

	// Find existing server
	for i, existing := range cm.config.Servers {
		if existing.ID == server.ID {
			// Update existing server
			cm.config.Servers[i] = server
			return cm.Save()
		}
	}

	// Add new server
	cm.config.Servers = append(cm.config.Servers, server)
	return cm.Save()
}

// RemoveServer removes a server from the configuration
func (cm *ConfigManager) RemoveServer(serverID string) error {
	if cm.config == nil {
		return fmt.Errorf("no configuration loaded")
	}

	// Find and remove server
	for i, server := range cm.config.Servers {
		if server.ID == serverID {
			cm.config.Servers = append(cm.config.Servers[:i], cm.config.Servers[i+1:]...)
			return cm.Save()
		}
	}

	return fmt.Errorf("server with ID %s not found", serverID)
}

// GetConfigPath returns the path to the configuration file
func (cm *ConfigManager) GetConfigPath() string {
	return cm.configPath
}

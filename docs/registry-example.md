# Registry Format Documentation

This document provides a comprehensive guide to the Neobelt registry format, explaining each field and how it's used within the application.

## Overview

A Neobelt registry is a JSON file containing an array of MCP server definitions. Each server entry describes how to install, configure, and run an MCP server using Docker. The registry format defines everything from basic metadata to complex environment variable configurations and Docker runtime parameters.

## Registry Structure

The registry file contains an array of server objects. Here's the complete structure with field-by-field explanations:

## Field Reference

### Basic Metadata

#### `name` (string, required)
The display name of the MCP server as shown in the Neobelt UI.

```json
"name": "Atlassian MCP"
```

**Usage in code:** Used throughout the UI for display purposes and stored in `InstalledServer.Name` and `ConfiguredServer.Name`.

#### `description` (string, required) 
A brief description of what the MCP server does.

```json
"description": "Atlassian MCP is a tool for managing Atlassian products."
```

**Usage in code:** Displayed in the registry browser and server details. Stored in `InstalledServer.Description`.

#### `setup_description` (string, optional)
Extended setup instructions or links to documentation. Supports markdown formatting.

```json
"setup_description": "Checkout the [Quick Start Guide](https://github.com/sooperset/mcp-atlassian?tab=readme-ov-file#quick-start-guide) for more information."
```

**Usage in code:** Displayed in server configuration modals to help users with setup. Stored in `InstalledServer.SetupDescription`.

#### `support_url` (string, optional)
URL where users can get help or report issues for this MCP server.

```json
"support_url": "https://github.com/sooperset/mcp-atlassian/issues"
```

**Usage in code:** Displayed as a link in the UI. Stored in `InstalledServer.SupportURL`.

### Docker Configuration

#### `docker_image` (string, required)
The Docker image name and tag to use for this MCP server.

```json
"docker_image": "ghcr.io/sooperset/mcp-atlassian:0.11.9"
```

**Usage in code:** Used by `DockerService.PullImage()` and `DockerService.CreateContainer()` in docker.go:350-364. Stored in `InstalledServer.DockerImage` and `ConfiguredServer.DockerImage`.

#### `docker_command` (string, optional)
Command-line arguments to pass to the Docker container. These become the container's CMD.

```json
"docker_command": "--transport streamable-http --port 9000"
```

**Usage in code:** Parsed by `parseDockerCommand()` in docker.go:564-574 and applied to the Docker container configuration. Arguments are split respecting quoted strings.

#### `ports` (object, optional)
Defines port mappings for the container. The `mcp` field specifies the internal MCP server port.

```json
"ports": {
    "mcp": 9000,
    "admin": null
}
```

**Usage in code:** The `mcp` port is extracted by `getMCPPortFromRegistry()` in app.go:1002-1022 and used for Docker port mapping. The host port is assigned dynamically starting from `ServerDefaults.DefaultPort`.

### Version Information

#### `version` (string, required)
The version of the MCP server. Used for update checking.

```json
"version": "0.11.9"
```

**Usage in code:** Used in `GetInstalledServersWithVersionCheck()` (app.go:861-914) to compare installed versions with registry versions and show update notifications.

#### `license` (string, optional)
The software license of the MCP server.

```json
"license": "MIT"
```

#### `maintainer` (string, optional)
Email address or organization maintaining this MCP server.

```json
"maintainer": "soomiles.dev@gmail.com"
```

### Classification

#### `tags` (array of strings, optional)
Tags for categorizing and filtering MCP servers.

```json
"tags": [
    "atlassian",
    "productivity", 
    "ticketing"
]
```

**Usage in code:** Used for filtering in the registry browser UI and stored in `InstalledServer.Tags`.

#### `architecture` (array of strings, optional)
Supported CPU architectures for this Docker image.

```json
"architecture": [
    "linux/amd64",
    "linux/arm64"
]
```

**Usage in code:** Can be used to filter compatible servers based on the user's system architecture.

### Environment Variables

The `environment_variables` object defines all environment variables that can be configured for this MCP server. This is one of the most complex parts of the registry format.

```json
"environment_variables": {
    "required": [...],
    "optional": [...], 
    "default": [...]
}
```

**Usage in code:** Processed extensively in the frontend:
- `parseEnvironmentVariables()` in Registry.js:1548-1594 converts registry format to UI form fields
- `extractEnvironmentVariablesConfig()` in Servers.js:251-308 handles both registry metadata and user values
- Environment variables are collected from UI forms and converted to `map[string]string` format
- Applied to Docker containers via `DockerService.CreateContainer()` in docker.go:379-384

#### Required Variables
Variables that must be provided by the user before the server can run.

```json
"required": [
    {
        "name": "JIRA_URL",
        "description": "The URL of the JIRA instance."
    },
    {
        "name": "JIRA_USERNAME", 
        "description": "The username for the JIRA instance."
    },
    {
        "name": "JIRA_API_TOKEN",
        "description": "The API token for the JIRA instance."
    }
]
```

**UI Behavior:** These appear as required form fields marked with asterisks. Users cannot save the configuration without providing values.

#### Optional Variables
Variables that enhance functionality but aren't required.

```json
"optional": [
    {
        "name": "ENABLED_TOOLS",
        "description": "Comma-separated list of tools to enable. See https://github.com/sooperset/mcp-atlassian/blob/main/docs/tools.md for more information."
    },
    {
        "name": "READ_ONLY_MODE",
        "description": "Enable read-only mode. This will prevent the MCP server from making any changes to the Atlassian instance.",
        "value": "true"
    }
]
```

**UI Behavior:** These appear as optional form fields. The `value` field provides a default/suggested value.

#### Default Variables  
Variables automatically set by Neobelt with sensible defaults. Users can override these if needed.

```json
"default": [
    {
        "name": "MCP_LOGGING_STDOUT",
        "description": "Enable logging to stdout instead of stderr.",
        "value": "true"
    },
    {
        "name": "MCP_VERBOSE",
        "description": "Enable verbose logging.",
        "value": "true"
    }
]
```

**UI Behavior:** These are pre-filled in the configuration form but can be modified by users.

### Resource Management

#### `resource_requirements` (object, optional)
Defines resource constraints for the Docker container.

```json
"resource_requirements": {
    "memory": "512MB"
}
```

**Usage in code:** The memory value is converted to bytes and applied via `hostConfig.Memory` in docker.go:420-423.

#### `health_check` (object, optional)
Configuration for container health checks.

```json
"health_check": {
    "endpoint": "/health",
    "interval": "30s"
}
```

**Usage in code:** Currently stored in the configuration but not yet implemented in the Docker container creation process.

#### `volumes` (array, optional)
Volume mounts for persistent data.

```json
"volumes": []
```

**Usage in code:** Converted to Docker mount points in `DockerService.CreateContainer()` in docker.go:387-395.

## Registry Processing Flow

1. **Registry Fetch**: `FetchAllRegistries()` (app.go:253-278) downloads registry JSON from configured URLs
2. **Server Installation**: `InstallServer()` (app.go:944-981) pulls Docker images and creates `InstalledServer` records  
3. **Server Configuration**: Frontend forms collect user input for environment variables and other settings
4. **Container Creation**: `CreateContainer()` (docker.go:367-477) applies all configuration to create Docker containers
5. **Persistence**: Configuration is saved in `ConfiguredServer` records via `ConfigManager`

## Example Registry Entry

Here's a complete example showing all fields in use:

```json
{
    "name": "Atlassian MCP",
    "description": "Atlassian MCP is a tool for managing Atlassian products.", 
    "setup_description": "Checkout the [Quick Start Guide](https://github.com/sooperset/mcp-atlassian?tab=readme-ov-file#quick-start-guide) for more information.",
    "support_url": "https://github.com/sooperset/mcp-atlassian/issues",
    "docker_image": "ghcr.io/sooperset/mcp-atlassian:0.11.9",
    "version": "0.11.9",
    "license": "MIT", 
    "maintainer": "soomiles.dev@gmail.com",
    "tags": [
        "atlassian",
        "productivity",
        "ticketing"
    ],
    "architecture": [
        "linux/amd64",
        "linux/arm64"
    ],
    "health_check": {
        "endpoint": "/health",
        "interval": "30s"
    },
    "resource_requirements": {
        "memory": "512MB"
    },
    "docker_command": "--transport streamable-http --port 9000",
    "environment_variables": {
        "required": [
            {
                "name": "JIRA_URL",
                "description": "The URL of the JIRA instance."
            }
        ],
        "optional": [
            {
                "name": "ENABLED_TOOLS",
                "description": "Comma-separated list of tools to enable.",
                "value": "confluence,jira"
            }
        ],
        "default": [
            {
                "name": "MCP_LOGGING_STDOUT", 
                "description": "Enable logging to stdout instead of stderr.",
                "value": "true"
            }
        ]
    },
    "ports": {
        "mcp": 9000,
        "admin": null
    },
    "volumes": []
}
```

## Creating Custom Registries

To create a custom registry:

1. Create a JSON file following this format
2. Host it on an HTTPS endpoint
3. Add the registry URL to Neobelt via Settings > Registries
4. The registry will be fetched and merged with the official registry

**Security Note:** Custom registries must use HTTPS. The official registry is the only exception allowed to use the specific hardcoded URL.

## Code References

Key files for understanding registry processing:

- `app.go:97-119` - `RegistryServer` struct definition
- `app.go:253-278` - Registry fetching logic
- `docker.go:367-477` - Container creation with registry configuration
- `frontend/src/pages/Registry.js` - Registry browser UI
- `frontend/src/pages/Servers.js` - Server configuration UI
- `config.go:51-94` - Persistent storage structures
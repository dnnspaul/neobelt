## General
Neobelt is a desktop application that allows end-users to manage MCP servers.
It's using Docker as backend to run the servers. The frontend is built with Go, Wails and Tailwind CSS.
It's not using a javascript framework like React or Vue.js, but plain JavaScript.
The application is meant to be run on Windows, macOS and Linux.

## Nomenclature
- Server: A MCP server instance. Represented by a Docker container.
- Server Image: A MCP server image that is already been pulled by Docker. Represented by a Docker image.
- Registry: A registry server is a HTTP endpoint that contains a JSON file with a list of available MCP server images. It contains required information to run the server, like environment variables, ports, volumes, etc.
- Installed Server: A MCP server that is installed. It's represented by a setup Docker image.
- Configured Server: A MCP server that is configured. It's represented by a running Docker container with configured environment variables, ports, volumes, etc.

## Dev Workflow
The developer is running the application with `wails dev`, so you shouldn't start it.
You can use the browserMCP to test the frontend (http://localhost:5173). Expect interactions with the Go backend are failing sometimes.

## Application Configuration
It's using Viper to load the configuration. It's centralized in the `config.go` file.

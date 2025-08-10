## General
Neobelt is a desktop application that allows end-users to manage MCP servers.
It's using Docker as backend to run the servers. The frontend is built with Go, Wails and Tailwind CSS.
It's not using a javascript framework like React or Vue.js, but plain JavaScript.
The application is meant to be run on Windows, macOS and Linux.

## Nomenclature
- Server: A MCP server instance. Represented by a Docker container.
- Server Image: A MCP server image that is already been pulled by Docker. Represented by a Docker image.
- Registry: A registry server is a HTTP endpoint that contains a JSON file with a list of available MCP server images. It contains required information to run the server, like environment variables, ports, volumes, etc. In `docs/registry-example.json` you can see an example of a registry file.
- Installed Server: A MCP server that is installed. It's represented by a setup Docker image.
- Configured Server: A MCP server that is configured. It's represented by a running Docker container with configured environment variables, ports, volumes, etc.

## Dev Workflow
The developer is running the application with `wails dev`, so you shouldn't start it.
Testing is mainly done by the user. Don't write tests.
If you think it would make sense to test it e2e yourself, you can use the browserMCP (http://localhost:34115).

## Application Configuration
It's using Viper to load the configuration. It's centralized in the `config.go` file.
Logging is centralized in the `logger.go` file with dedicated functions for each log level, don't use fmt.Printf or fmt.Println.

## Principles
Follow the guidelines of DRY and KISS.
Before you implement something, think about the best way to do it and read other files to see if there is something similar you can reuse or adjust for your needs. Always make sure that you don't brick something else.

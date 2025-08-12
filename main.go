package main

import (
	"bufio"
	"bytes"
	"context"
	"embed"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
)

//go:embed all:frontend/dist
var assets embed.FS

// JSON-RPC 2.0 message structures
type JSONRPCMessage struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      interface{}     `json:"id,omitempty"`
	Method  string          `json:"method,omitempty"`
	Params  json.RawMessage `json:"params,omitempty"`
	Result  json.RawMessage `json:"result,omitempty"`
	Error   *JSONRPCError   `json:"error,omitempty"`
}

type JSONRPCError struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// MCPProxy handles the stdio <-> HTTP bridging
type MCPProxy struct {
	targetURL   string
	headers     map[string]string
	httpClient  *http.Client
}

func NewMCPProxy(targetURL string, headersList []string) *MCPProxy {
	headers := make(map[string]string)
	for _, header := range headersList {
		parts := strings.SplitN(header, ":", 2)
		if len(parts) == 2 {
			headers[strings.TrimSpace(parts[0])] = strings.TrimSpace(parts[1])
		}
	}
	
	return &MCPProxy{
		targetURL:  targetURL,
		headers:    headers,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

func main() {
	// Check if CLI arguments are provided
	if len(os.Args) > 1 {
		runCLI()
		return
	}

	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:    "neobelt",
		Width:    1280,
		MinWidth: 1280,
		Height:   768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
		Mac: &mac.Options{
			About: &mac.AboutInfo{
				Title:   "Neobelt",
				Message: "Neobelt is a tool for managing your MCP servers.",
			},
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}

type headerFlag []string

func (h *headerFlag) String() string {
	return strings.Join(*h, ",")
}

func (h *headerFlag) Set(value string) error {
	*h = append(*h, value)
	return nil
}

func runCLI() {
	var headers headerFlag
	var mcpProxy bool
	
	// Create a new flag set for CLI commands
	cliFlags := flag.NewFlagSet("neobelt", flag.ExitOnError)
	
	cliFlags.BoolVar(&mcpProxy, "mcp-proxy", false, "Start MCP proxy server")
	cliFlags.Var(&headers, "h", "Add HTTP header (can be used multiple times)")
	cliFlags.Var(&headers, "header", "Add HTTP header (can be used multiple times)")
	
	// Parse CLI arguments (skip program name)
	cliFlags.Parse(os.Args[1:])
	
	if mcpProxy {
		args := cliFlags.Args()
		if len(args) == 0 {
			fmt.Println("Error: MCP proxy requires a target URL")
			fmt.Println("Usage: neobelt --mcp-proxy -h \"Authorization: Bearer TOKEN\" https://mcp-server.tld/mcp")
			os.Exit(1)
		}
		
		targetURL := args[0]
		startMCPProxy(targetURL, headers)
		return
	}
	
	// Show help if no recognized command
	fmt.Println("Neobelt CLI")
	fmt.Println("Usage:")
	fmt.Println("  neobelt --mcp-proxy -h \"Header: Value\" <target-url>")
}

// Start the MCP proxy server
func (p *MCPProxy) Start(ctx context.Context) error {
	scanner := bufio.NewScanner(os.Stdin)
	
	for scanner.Scan() {
		line := scanner.Text()
		if strings.TrimSpace(line) == "" {
			continue
		}
		
		// Parse JSON-RPC message from stdin
		var message JSONRPCMessage
		if err := json.Unmarshal([]byte(line), &message); err != nil {
			// Send error response to stdout
			errorResponse := JSONRPCMessage{
				JSONRPC: "2.0",
				ID:      nil,
				Error: &JSONRPCError{
					Code:    -32700,
					Message: "Parse error",
					Data:    err.Error(),
				},
			}
			p.sendResponse(errorResponse)
			continue
		}
		
		// Forward message to HTTP endpoint
		response, err := p.forwardToHTTP(ctx, message)
		if err != nil {
			// Send error response to stdout
			errorResponse := JSONRPCMessage{
				JSONRPC: "2.0",
				ID:      message.ID,
				Error: &JSONRPCError{
					Code:    -32603,
					Message: "Internal error",
					Data:    err.Error(),
				},
			}
			p.sendResponse(errorResponse)
			continue
		}
		
		// Send response back to stdout
		p.sendResponse(response)
	}
	
	return scanner.Err()
}

// Forward JSON-RPC message to HTTP endpoint
func (p *MCPProxy) forwardToHTTP(ctx context.Context, message JSONRPCMessage) (JSONRPCMessage, error) {
	// Serialize message
	messageBytes, err := json.Marshal(message)
	if err != nil {
		return JSONRPCMessage{}, fmt.Errorf("failed to marshal message: %w", err)
	}
	
	// Create HTTP request
	req, err := http.NewRequestWithContext(ctx, "POST", p.targetURL, bytes.NewReader(messageBytes))
	if err != nil {
		return JSONRPCMessage{}, fmt.Errorf("failed to create request: %w", err)
	}
	
	// Set headers
	req.Header.Set("Content-Type", "application/json")
	for key, value := range p.headers {
		req.Header.Set(key, value)
	}
	
	// Send request
	resp, err := p.httpClient.Do(req)
	if err != nil {
		return JSONRPCMessage{}, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()
	
	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return JSONRPCMessage{}, fmt.Errorf("failed to read response: %w", err)
	}
	
	// Check HTTP status
	if resp.StatusCode != http.StatusOK {
		return JSONRPCMessage{}, fmt.Errorf("HTTP error: %d %s", resp.StatusCode, string(body))
	}
	
	// Parse JSON-RPC response
	var response JSONRPCMessage
	if err := json.Unmarshal(body, &response); err != nil {
		return JSONRPCMessage{}, fmt.Errorf("failed to parse response: %w", err)
	}
	
	return response, nil
}

// Send JSON-RPC response to stdout
func (p *MCPProxy) sendResponse(message JSONRPCMessage) {
	responseBytes, err := json.Marshal(message)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error marshaling response: %v\n", err)
		return
	}
	
	fmt.Println(string(responseBytes))
}

func startMCPProxy(targetURL string, headers []string) {
	proxy := NewMCPProxy(targetURL, headers)
	ctx := context.Background()
	
	if err := proxy.Start(ctx); err != nil {
		fmt.Fprintf(os.Stderr, "Proxy error: %v\n", err)
		os.Exit(1)
	}
}

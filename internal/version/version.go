package version

// Build-time variables set via -ldflags during compilation
var (
	// Version is the application version, typically from Git tags
	// Defaults to "DEV BUILD" for development builds
	Version = "DEV BUILD"
	
	// BuildTime is when the binary was built
	BuildTime = "unknown"
	
	// CommitHash is the git commit hash the build was made from
	CommitHash = "unknown"
)

// GetVersionInfo returns version information for the application
func GetVersionInfo() map[string]string {
	return map[string]string{
		"version":    Version,
		"buildTime":  BuildTime,
		"commitHash": CommitHash,
	}
}
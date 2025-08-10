package main

import (
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// Logger wraps the standard logger with additional functionality
type Logger struct {
	infoLogger  *log.Logger
	errorLogger *log.Logger
	debugLogger *log.Logger
	logFile     *os.File
	debugMode   bool
}

// LogLevel represents different log levels
type LogLevel int

const (
	LogLevelInfo LogLevel = iota
	LogLevelError
	LogLevelDebug
	LogLevelWarning
)

var appLogger *Logger

// InitLogger initializes the application logger
func InitLogger(logDir string, debugMode bool) error {
	// Create log file with current date
	logFileName := fmt.Sprintf("neobelt-%s.log", time.Now().Format("2006-01-02"))
	logFilePath := filepath.Join(logDir, logFileName)

	// Open log file
	logFile, err := os.OpenFile(logFilePath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		return fmt.Errorf("failed to open log file: %w", err)
	}

	// Create multi-writers for both file and console output
	infoWriter := io.MultiWriter(os.Stdout, logFile)
	errorWriter := io.MultiWriter(os.Stderr, logFile)
	
	var debugWriter io.Writer
	if debugMode {
		debugWriter = io.MultiWriter(os.Stdout, logFile)
	} else {
		// When debug mode is off, don't write debug messages anywhere
		debugWriter = io.Discard
	}

	// Create loggers with different prefixes
	infoLogger := log.New(infoWriter, "[INFO] ", log.Ldate|log.Ltime|log.Lshortfile)
	errorLogger := log.New(errorWriter, "[ERROR] ", log.Ldate|log.Ltime|log.Lshortfile)
	debugLogger := log.New(debugWriter, "[DEBUG] ", log.Ldate|log.Ltime|log.Lshortfile)

	appLogger = &Logger{
		infoLogger:  infoLogger,
		errorLogger: errorLogger,
		debugLogger: debugLogger,
		logFile:     logFile,
		debugMode:   debugMode,
	}

	LogInfo("Logger initialized with debug mode: %t", debugMode)
	return nil
}

// CloseLogger closes the log file
func CloseLogger() {
	if appLogger != nil && appLogger.logFile != nil {
		appLogger.logFile.Close()
	}
}

// LogInfo logs an info message
func LogInfo(format string, args ...interface{}) {
	if appLogger != nil {
		appLogger.infoLogger.Printf(format, args...)
	} else {
		// Fallback to standard output if logger not initialized
		fmt.Printf("[INFO] "+format+"\n", args...)
	}
}

// LogError logs an error message
func LogError(format string, args ...interface{}) {
	if appLogger != nil {
		appLogger.errorLogger.Printf(format, args...)
	} else {
		// Fallback to standard error if logger not initialized
		fmt.Fprintf(os.Stderr, "[ERROR] "+format+"\n", args...)
	}
}

// LogDebug logs a debug message (only shown in console if debug mode is enabled)
func LogDebug(format string, args ...interface{}) {
	if appLogger != nil {
		appLogger.debugLogger.Printf(format, args...)
	} else if appLogger == nil {
		// Fallback - only show if we can't determine debug mode
		fmt.Printf("[DEBUG] "+format+"\n", args...)
	}
}

// LogWarning logs a warning message
func LogWarning(format string, args ...interface{}) {
	if appLogger != nil {
		// Use info logger with WARNING prefix
		appLogger.infoLogger.Printf("[WARNING] "+format, args...)
	} else {
		fmt.Printf("[WARNING] "+format+"\n", args...)
	}
}

// SetDebugMode updates the debug mode setting
func SetDebugMode(enabled bool) {
	if appLogger != nil {
		appLogger.debugMode = enabled
		
		// Recreate debug logger with appropriate writer
		var debugWriter io.Writer
		if enabled {
			debugWriter = io.MultiWriter(os.Stdout, appLogger.logFile)
		} else {
			// When debug mode is off, don't write debug messages anywhere
			debugWriter = io.Discard
		}
		
		appLogger.debugLogger = log.New(debugWriter, "[DEBUG] ", log.Ldate|log.Ltime|log.Lshortfile)
		LogInfo("Debug mode updated to: %t", enabled)
	}
}

// CleanupOldLogs removes log files older than the specified retention period
func CleanupOldLogs(logDir string, retentionDays int) error {
	if retentionDays <= 0 {
		return nil // Don't cleanup if retention is 0 or negative
	}

	cutoffTime := time.Now().AddDate(0, 0, -retentionDays)
	
	entries, err := os.ReadDir(logDir)
	if err != nil {
		return fmt.Errorf("failed to read log directory: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		
		// Only process .log files that match our naming pattern
		if !strings.HasSuffix(entry.Name(), ".log") || !strings.HasPrefix(entry.Name(), "neobelt-") {
			continue
		}

		info, err := entry.Info()
		if err != nil {
			LogWarning("Failed to get file info for %s: %v", entry.Name(), err)
			continue
		}

		if info.ModTime().Before(cutoffTime) {
			logPath := filepath.Join(logDir, entry.Name())
			if err := os.Remove(logPath); err != nil {
				LogWarning("Failed to remove old log file %s: %v", logPath, err)
			} else {
				LogInfo("Removed old log file: %s", entry.Name())
			}
		}
	}

	return nil
}

// GetDebugMode returns the current debug mode status
func GetDebugMode() bool {
	if appLogger != nil {
		return appLogger.debugMode
	}
	return false
}
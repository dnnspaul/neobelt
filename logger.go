package main

import (
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"
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

// LogMessage represents a log entry stored in memory
type LogMessage struct {
	Level     LogLevel  `json:"level"`
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
}

// LogBuffer manages a circular buffer of log messages
type LogBuffer struct {
	messages []LogMessage
	index    int
	size     int
	mutex    sync.RWMutex
}

// NewLogBuffer creates a new log buffer with specified size
func NewLogBuffer(size int) *LogBuffer {
	return &LogBuffer{
		messages: make([]LogMessage, size),
		size:     size,
	}
}

// Add adds a new log message to the buffer
func (lb *LogBuffer) Add(level LogLevel, message string) {
	lb.mutex.Lock()
	defer lb.mutex.Unlock()

	lb.messages[lb.index] = LogMessage{
		Level:     level,
		Message:   message,
		Timestamp: time.Now(),
	}
	lb.index = (lb.index + 1) % lb.size
}

// GetRecent returns the most recent log messages (up to count)
func (lb *LogBuffer) GetRecent(count int) []LogMessage {
	lb.mutex.RLock()
	defer lb.mutex.RUnlock()

	if count > lb.size {
		count = lb.size
	}

	result := make([]LogMessage, 0, count)
	
	// Find the starting point - walk backwards from current index
	start := (lb.index - count + lb.size) % lb.size
	
	for i := 0; i < count; i++ {
		idx := (start + i) % lb.size
		msg := lb.messages[idx]
		// Only include messages that have been set (non-zero timestamp)
		if !msg.Timestamp.IsZero() {
			result = append(result, msg)
		}
	}

	return result
}

var appLogger *Logger
var logBuffer *LogBuffer

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

	// Initialize log buffer to keep last 100 messages in memory
	logBuffer = NewLogBuffer(100)

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
	message := fmt.Sprintf(format, args...)
	
	if appLogger != nil {
		appLogger.infoLogger.Printf(format, args...)
	} else {
		// Fallback to standard output if logger not initialized
		fmt.Printf("[INFO] "+format+"\n", args...)
	}
	
	// Add to memory buffer
	if logBuffer != nil {
		logBuffer.Add(LogLevelInfo, message)
	}
}

// LogError logs an error message
func LogError(format string, args ...interface{}) {
	message := fmt.Sprintf(format, args...)
	
	if appLogger != nil {
		appLogger.errorLogger.Printf(format, args...)
	} else {
		// Fallback to standard error if logger not initialized
		fmt.Fprintf(os.Stderr, "[ERROR] "+format+"\n", args...)
	}
	
	// Add to memory buffer
	if logBuffer != nil {
		logBuffer.Add(LogLevelError, message)
	}
}

// LogDebug logs a debug message (only shown in console if debug mode is enabled)
func LogDebug(format string, args ...interface{}) {
	message := fmt.Sprintf(format, args...)
	
	if appLogger != nil {
		appLogger.debugLogger.Printf(format, args...)
	} else if appLogger == nil {
		// Fallback - only show if we can't determine debug mode
		fmt.Printf("[DEBUG] "+format+"\n", args...)
	}
	
	// Add to memory buffer
	if logBuffer != nil {
		logBuffer.Add(LogLevelDebug, message)
	}
}

// LogWarning logs a warning message
func LogWarning(format string, args ...interface{}) {
	message := fmt.Sprintf(format, args...)
	
	if appLogger != nil {
		// Use info logger with WARNING prefix
		appLogger.infoLogger.Printf("[WARNING] "+format, args...)
	} else {
		fmt.Printf("[WARNING] "+format+"\n", args...)
	}
	
	// Add to memory buffer
	if logBuffer != nil {
		logBuffer.Add(LogLevelWarning, message)
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

// GetRecentLogMessages returns the most recent log messages from the memory buffer
func GetRecentLogMessages(count int) []LogMessage {
	if logBuffer == nil {
		return []LogMessage{}
	}
	return logBuffer.GetRecent(count)
}
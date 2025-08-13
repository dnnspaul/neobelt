package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"

	"golang.org/x/crypto/pbkdf2"
	"neobelt/internal/config"
)

// EncryptedData represents the structure of encrypted configuration data
type EncryptedData struct {
	Salt       string `json:"salt"`
	Nonce      string `json:"nonce"`
	CipherText string `json:"cipher_text"`
	Version    string `json:"version"`
}

// EncryptConfiguration encrypts the configuration data with a password
func EncryptConfiguration(config *config.Configuration, password string) ([]byte, error) {
	if config == nil {
		return nil, fmt.Errorf("configuration is nil")
	}

	if password == "" {
		return nil, fmt.Errorf("password cannot be empty")
	}

	// Serialize configuration to JSON
	configJSON, err := json.Marshal(config)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal configuration: %w", err)
	}

	// Generate random salt
	salt := make([]byte, 32)
	if _, err := io.ReadFull(rand.Reader, salt); err != nil {
		return nil, fmt.Errorf("failed to generate salt: %w", err)
	}

	// Derive key using PBKDF2
	key := pbkdf2.Key([]byte(password), salt, 100000, 32, sha256.New)

	// Create AES cipher
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("failed to create cipher: %w", err)
	}

	// Use GCM mode for authenticated encryption
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("failed to create GCM: %w", err)
	}

	// Generate random nonce
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, fmt.Errorf("failed to generate nonce: %w", err)
	}

	// Encrypt the data
	ciphertext := gcm.Seal(nil, nonce, configJSON, nil)

	// Create encrypted data structure
	encryptedData := EncryptedData{
		Salt:       base64.StdEncoding.EncodeToString(salt),
		Nonce:      base64.StdEncoding.EncodeToString(nonce),
		CipherText: base64.StdEncoding.EncodeToString(ciphertext),
		Version:    "1.0",
	}

	// Serialize encrypted data to JSON
	result, err := json.MarshalIndent(encryptedData, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("failed to marshal encrypted data: %w", err)
	}

	return result, nil
}

// DecryptConfiguration decrypts the configuration data with a password
func DecryptConfiguration(encryptedData []byte, password string) (*config.Configuration, error) {
	if len(encryptedData) == 0 {
		return nil, fmt.Errorf("encrypted data is empty")
	}

	if password == "" {
		return nil, fmt.Errorf("password cannot be empty")
	}

	// Parse encrypted data
	var data EncryptedData
	if err := json.Unmarshal(encryptedData, &data); err != nil {
		return nil, fmt.Errorf("failed to parse encrypted data: %w", err)
	}

	// Validate version
	if data.Version != "1.0" {
		return nil, fmt.Errorf("unsupported encryption version: %s", data.Version)
	}

	// Decode base64 data
	salt, err := base64.StdEncoding.DecodeString(data.Salt)
	if err != nil {
		return nil, fmt.Errorf("failed to decode salt: %w", err)
	}

	nonce, err := base64.StdEncoding.DecodeString(data.Nonce)
	if err != nil {
		return nil, fmt.Errorf("failed to decode nonce: %w", err)
	}

	ciphertext, err := base64.StdEncoding.DecodeString(data.CipherText)
	if err != nil {
		return nil, fmt.Errorf("failed to decode ciphertext: %w", err)
	}

	// Derive key using same parameters as encryption
	key := pbkdf2.Key([]byte(password), salt, 100000, 32, sha256.New)

	// Create AES cipher
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("failed to create cipher: %w", err)
	}

	// Use GCM mode
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("failed to create GCM: %w", err)
	}

	// Decrypt the data
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt data (wrong password?): %w", err)
	}

	// Parse configuration
	var config config.Configuration
	if err := json.Unmarshal(plaintext, &config); err != nil {
		return nil, fmt.Errorf("failed to parse decrypted configuration: %w", err)
	}

	return &config, nil
}
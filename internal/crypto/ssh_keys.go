package crypto

import (
	"crypto/ed25519"
	"crypto/rand"
	"crypto/x509"
	"encoding/pem"
	"fmt"

	"golang.org/x/crypto/ssh"
)

// SSHKeyPair represents an SSH key pair
type SSHKeyPair struct {
	PrivateKey string `json:"private_key"`
	PublicKey  string `json:"public_key"`
}

// GenerateSSHKeyPair generates a new ED25519 SSH key pair
func GenerateSSHKeyPair() (*SSHKeyPair, error) {
	// Generate ED25519 key pair
	publicKey, privateKey, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return nil, fmt.Errorf("failed to generate ED25519 key pair: %w", err)
	}

	// Convert private key to PEM format
	privateKeyBytes, err := x509.MarshalPKCS8PrivateKey(privateKey)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal private key: %w", err)
	}

	privateKeyPEM := pem.EncodeToMemory(&pem.Block{
		Type:  "PRIVATE KEY",
		Bytes: privateKeyBytes,
	})

	// Convert public key to SSH format
	sshPublicKey, err := ssh.NewPublicKey(publicKey)
	if err != nil {
		return nil, fmt.Errorf("failed to create SSH public key: %w", err)
	}

	publicKeySSH := string(ssh.MarshalAuthorizedKey(sshPublicKey))

	return &SSHKeyPair{
		PrivateKey: string(privateKeyPEM),
		PublicKey:  publicKeySSH,
	}, nil
}

// ValidateSSHKeyPair validates an SSH key pair
func ValidateSSHKeyPair(privateKeyPEM, publicKeySSH string) error {
	// Parse private key
	block, _ := pem.Decode([]byte(privateKeyPEM))
	if block == nil {
		return fmt.Errorf("failed to decode private key PEM")
	}

	privateKey, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return fmt.Errorf("failed to parse private key: %w", err)
	}

	// Parse public key
	sshPublicKey, _, _, _, err := ssh.ParseAuthorizedKey([]byte(publicKeySSH))
	if err != nil {
		return fmt.Errorf("failed to parse SSH public key: %w", err)
	}

	// Verify key pair match
	derivedPublicKey, err := ssh.NewPublicKey(privateKey.(ed25519.PrivateKey).Public())
	if err != nil {
		return fmt.Errorf("failed to derive public key from private key: %w", err)
	}

	if string(sshPublicKey.Marshal()) != string(derivedPublicKey.Marshal()) {
		return fmt.Errorf("private and public keys do not match")
	}

	return nil
}

// GetPublicKeyFromPrivate derives the SSH public key from a private key
func GetPublicKeyFromPrivate(privateKeyPEM string) (string, error) {
	// Parse private key
	block, _ := pem.Decode([]byte(privateKeyPEM))
	if block == nil {
		return "", fmt.Errorf("failed to decode private key PEM")
	}

	privateKey, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return "", fmt.Errorf("failed to parse private key: %w", err)
	}

	// Derive public key
	sshPublicKey, err := ssh.NewPublicKey(privateKey.(ed25519.PrivateKey).Public())
	if err != nil {
		return "", fmt.Errorf("failed to derive public key: %w", err)
	}

	return string(ssh.MarshalAuthorizedKey(sshPublicKey)), nil
}
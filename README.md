# PII Shield - Secure Text Encryption

A privacy-focused web application for encrypting sensitive text using military-grade encryption (AES-GCM with Argon2id key derivation).

## Features

- **Strong Encryption**: AES-GCM encryption with 256-bit keys
- **Memory-Hard Key Derivation**: Argon2id protects against GPU-based attacks
- **Client-Side Only**: All encryption happens in your browser - no data is sent to any server
- **User-Friendly Interface**: Clean, modern UI with Tailwind CSS
- **Unique Security**: Each encryption uses a unique salt and nonce

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run check
```

## Usage

1. **Encrypt Text**:
   - Enter your sensitive text in the "Plaintext Input" field
   - Create a strong secret phrase (this will be your decryption key)
   - Click "🔒 Encrypt"
   - Copy the encrypted output - it's safe to store or share

2. **Decrypt Text**:
   - Paste the encrypted text in the "Encrypted Output" field
   - Enter the same secret phrase used for encryption
   - Click "🔓 Decrypt"
   - Your original text will appear in the plaintext field

## Security Details

- **Encryption**: AES-GCM (Authenticated Encryption)
- **Key Size**: 256 bits
- **Key Derivation**: Argon2id with:
  - Time cost: 2 iterations
  - Memory cost: 100 MB
  - Salt: 16 bytes (unique per encryption)
- **Nonce**: 12 bytes (unique per encryption)

## Tech Stack

- **Frontend Framework**: Svelte 4
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Crypto Library**: argon2-browser + Web Crypto API

## Development

The project structure:
```
src/
├── App.svelte          # Main app component with tab navigation
├── lib/
│   ├── crypto.ts       # Encryption/decryption logic
│   └── EncryptorTab.svelte  # Encryptor UI component
├── app.css            # Global styles and animations
└── main.ts            # App entry point
```

## Roadmap

- [ ] Implement Paragraph Processor tab for batch encryption
- [ ] Add Settings tab with customizable encryption parameters
- [ ] Add file encryption support
- [ ] Implement secure password strength indicator
- [ ] Add export/import functionality for encrypted data

## License

This project is built with privacy and security in mind. Feel free to audit the code - all cryptographic operations are transparent and happen client-side.
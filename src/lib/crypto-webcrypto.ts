/**
 * Pure Web Crypto API implementation - no external dependencies
 * Uses PBKDF2 instead of Argon2 for better browser compatibility
 */

/**
 * Converts an ArrayBuffer or Uint8Array to a Base64 string safely
 */
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  let binary = '';
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const chunkSize = 0x8000; // 32k chunks
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize) as any);
  }
  return btoa(binary);
}

/**
 * Converts a Base64 string to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  return new Uint8Array(binary.split('').map(char => char.charCodeAt(0)));
}

// Get encryption settings from localStorage
function getEncryptionSettings() {
  try {
    const saved = localStorage.getItem('pii-shield-settings');
    if (saved) {
      const settings = JSON.parse(saved);
      return settings.encryption || {};
    }
  } catch (e) {
    console.error('Failed to load encryption settings:', e);
  }
  
  // Return defaults optimized for PBKDF2
  return {
    iterations: 100000, // PBKDF2 standard recommendation
    saltLength: 16,
    keyLength: 32 // 256-bit key
  };
}

/**
 * Derives a key using PBKDF2 (Web Crypto API native)
 */
async function deriveKey(password: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  // Import the password as a key
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Derive the actual encryption key
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts plaintext using AES-GCM with PBKDF2 key derivation
 * Returns a compact binary format encoded in Base64
 */
export async function encryptText(plaintext: string, secret: string): Promise<string> {
  try {
    console.log('Starting encryption with Web Crypto API...');
    
    const settings = getEncryptionSettings();
    
    // Generate salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(16)); // 16 bytes salt
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 bytes IV for AES-GCM
    
    // Derive key using PBKDF2
    const key = await deriveKey(secret, salt, settings.iterations);
    
    // Encrypt the plaintext
    const plaintextBytes = new TextEncoder().encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      plaintextBytes
    );
    
    // Create compact binary format: version(1) + iterations(4) + salt(16) + iv(12) + ciphertext
    const ciphertextBytes = new Uint8Array(ciphertext);
    const totalLength = 1 + 4 + 16 + 12 + ciphertextBytes.length;
    const result = new Uint8Array(totalLength);
    
    let offset = 0;
    
    // Version byte (2 for PBKDF2)
    result[offset] = 2;
    offset += 1;
    
    // Iterations (4 bytes, big-endian)
    const iterationsBytes = new Uint8Array(4);
    new DataView(iterationsBytes.buffer).setUint32(0, settings.iterations, false);
    result.set(iterationsBytes, offset);
    offset += 4;
    
    // Salt (16 bytes)
    result.set(salt, offset);
    offset += 16;
    
    // IV (12 bytes)
    result.set(iv, offset);
    offset += 12;
    
    // Ciphertext (remaining bytes)
    result.set(ciphertextBytes, offset);
    
    // Return as Base64
    return arrayBufferToBase64(result);
    
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypts a compact binary format encrypted payload
 */
export async function decryptText(encryptedPayload: string, secret: string): Promise<string> {
  try {
    console.log('Starting decryption with Web Crypto API...');
    
    // Decode from Base64
    const data = base64ToUint8Array(encryptedPayload);
    
    if (data.length < 33) { // minimum: 1 + 4 + 16 + 12 = 33 bytes
      throw new Error('Invalid encrypted data format');
    }
    
    let offset = 0;
    
    // Read version
    const version = data[offset];
    offset += 1;
    
    if (version !== 2) {
      throw new Error(`Unsupported encryption version: ${version}`);
    }
    
    // Read iterations (4 bytes, big-endian)
    const iterations = new DataView(data.buffer, data.byteOffset + offset, 4).getUint32(0, false);
    offset += 4;
    
    // Read salt (16 bytes)
    const salt = data.slice(offset, offset + 16);
    offset += 16;
    
    // Read IV (12 bytes)
    const iv = data.slice(offset, offset + 12);
    offset += 12;
    
    // Read ciphertext (remaining bytes)
    const ciphertext = data.slice(offset);
    
    console.log(`Decrypting with ${iterations} iterations`);
    
    // Derive the same key
    const key = await deriveKey(secret, salt, iterations);
    
    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      ciphertext
    );
    
    const decryptedText = new TextDecoder().decode(decryptedBuffer);
    console.log('Decryption successful');
    
    return decryptedText;
    
  } catch (error) {
    console.error('Decryption error:', error);
    if (error.name === 'OperationError') {
      throw new Error('Decryption failed. Check your secret phrase.');
    }
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Calculates password strength (0-100)
 */
export function calculatePasswordStrength(password: string): number {
  let strength = 0;
  
  // Length
  if (password.length >= 8) strength += 20;
  if (password.length >= 12) strength += 10;
  if (password.length >= 16) strength += 10;
  
  // Character diversity
  if (/[a-z]/.test(password)) strength += 10;
  if (/[A-Z]/.test(password)) strength += 10;
  if (/[0-9]/.test(password)) strength += 10;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 20;
  
  // Common patterns (negative points)
  if (/(.)\1{2,}/.test(password)) strength -= 10;
  if (/^[0-9]+$/.test(password)) strength -= 10;
  if (/^[a-zA-Z]+$/.test(password)) strength -= 10;
  
  return Math.max(0, Math.min(100, strength));
}
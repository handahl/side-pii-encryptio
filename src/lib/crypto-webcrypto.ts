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
 */
export async function encryptText(plaintext: string, secret: string): Promise<string> {
  try {
    console.log('Starting encryption with Web Crypto API...');
    
    const settings = getEncryptionSettings();
    console.log('Encryption settings:', settings);
    
    // Generate salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(settings.saltLength));
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
    
    console.log('Generated salt and IV');
    
    // Derive key using PBKDF2
    const key = await deriveKey(secret, salt, settings.iterations);
    console.log('Key derived successfully');
    
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
    
    console.log('Encryption successful');
    
    // Create payload
    const payload = {
      v: 2, // version 2 for PBKDF2
      algorithm: 'PBKDF2-SHA256',
      salt: arrayBufferToBase64(salt),
      iv: arrayBufferToBase64(iv),
      ciphertext: arrayBufferToBase64(ciphertext),
      params: {
        iterations: settings.iterations,
        saltLength: settings.saltLength,
        keyLength: settings.keyLength
      }
    };
    
    return btoa(JSON.stringify(payload));
    
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypts an encrypted payload using PBKDF2 key derivation
 */
export async function decryptText(encryptedPayload: string, secret: string): Promise<string> {
  try {
    console.log('Starting decryption with Web Crypto API...');
    
    // Parse payload
    const payload = JSON.parse(atob(encryptedPayload));
    console.log('Payload version:', payload.v, 'Algorithm:', payload.algorithm);
    
    // Extract components
    const salt = base64ToUint8Array(payload.salt);
    const iv = base64ToUint8Array(payload.iv);
    const ciphertext = base64ToUint8Array(payload.ciphertext);
    
    // Use stored parameters
    const params = payload.params || getEncryptionSettings();
    
    // Derive the same key
    const key = await deriveKey(secret, salt, params.iterations);
    console.log('Key re-derived successfully');
    
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
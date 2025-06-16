import argon2 from 'argon2-browser';

/**
 * Converts an ArrayBuffer or Uint8Array to a Base64 string safely, avoiding call-stack overflows.
 * @param buffer - The ArrayBuffer or Uint8Array to convert
 * @returns Base64-encoded string
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
  
  // Return defaults if no settings found
  return {
    iterations: 2,
    memory: 102400,
    hashLength: 32
  };
}

/**
 * Encrypts plaintext using AES-GCM with a key derived from a secret phrase using Argon2id
 * @param plaintext - The text to encrypt
 * @param secret - The secret phrase to derive the encryption key from
 * @returns A Base64-encoded JSON payload containing salt, nonce, and ciphertext
 */
export async function encryptText(plaintext: string, secret: string): Promise<string> {
  try {
    const settings = getEncryptionSettings();
    
    // Step 1: Generate a cryptographically secure 16-byte salt
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // Step 2: Derive a key using Argon2id with settings from localStorage
    const keyResult = await argon2.hash({
      pass: secret,
      salt: salt,
      time: settings.iterations,
      mem: settings.memory,
      hashLen: settings.hashLength,
      type: argon2.ArgonType.Argon2id
    });

    // Convert the derived key hash to Uint8Array
    const derivedKey = new Uint8Array(keyResult.hash);

    // Step 3: Generate a cryptographically secure 12-byte nonce/IV
    const nonce = crypto.getRandomValues(new Uint8Array(12));

    // Step 4: Import the derived key for use with Web Crypto API
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      derivedKey,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    // Convert plaintext to Uint8Array
    const plaintextBytes = new TextEncoder().encode(plaintext);

    // Encrypt the plaintext using AES-GCM
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: nonce
      },
      cryptoKey,
      plaintextBytes
    );

    // Step 5: Create JSON object with Base64-encoded components
    // Include settings version for future compatibility
    const payload = {
      v: 1, // version
      salt: btoa(String.fromCharCode(...salt)),
      nonce: btoa(String.fromCharCode(...nonce)),
      ciphertext: arrayBufferToBase64(ciphertext),
      // Store the parameters used for this encryption
      params: {
        iterations: settings.iterations,
        memory: settings.memory,
        hashLen: settings.hashLength
      }
    };

    // Step 6: JSON.stringify and Base64 encode the entire payload
    const jsonPayload = JSON.stringify(payload);
    const base64Payload = btoa(jsonPayload);

    return base64Payload;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Unable to generate encryption key. Your device may be low on memory.');
  }
}

/**
 * Decrypts an encrypted payload using the provided secret phrase
 * @param encryptedPayload - The Base64-encoded encrypted payload
 * @param secret - The secret phrase used for decryption
 * @returns The decrypted plaintext
 * @throws Error if decryption fails
 */
export async function decryptText(encryptedPayload: string, secret: string): Promise<string> {
  try {
    // Step 1: Decode the input from Base64
    const jsonPayload = atob(encryptedPayload);

    // Step 2: Parse the JSON to get salt, nonce, and ciphertext
    const payload = JSON.parse(jsonPayload);

    // Step 3: Decode salt, nonce, and ciphertext from Base64 to Uint8Array
    const salt = new Uint8Array(
      atob(payload.salt).split('').map(char => char.charCodeAt(0))
    );
    const nonce = new Uint8Array(
      atob(payload.nonce).split('').map(char => char.charCodeAt(0))
    );
    const ciphertext = new Uint8Array(
      atob(payload.ciphertext).split('').map(char => char.charCodeAt(0))
    );

    // Use stored parameters if available, otherwise use current settings
    const params = payload.params || getEncryptionSettings();

    // Step 4: Re-derive the exact same key using the stored salt and parameters
    const keyResult = await argon2.hash({
      pass: secret,
      salt: salt,
      time: params.iterations,
      mem: params.memory,
      hashLen: params.hashLen || params.hashLength,
      type: argon2.ArgonType.Argon2id
    });

    // Convert the derived key hash to Uint8Array
    const derivedKey = new Uint8Array(keyResult.hash);

    // Import the derived key for use with Web Crypto API
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      derivedKey,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // Step 5: Decrypt the ciphertext using AES-GCM
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: nonce
      },
      cryptoKey,
      ciphertext
    );

    // Step 6: Convert the decrypted ArrayBuffer back to string
    const decryptedText = new TextDecoder().decode(decryptedBuffer);

    // Step 7: Return the decrypted plaintext
    return decryptedText;

  } catch (error) {
    // Step 8: If any step fails, throw a descriptive error
    throw new Error('Decryption failed. Check secret phrase or input data.');
  }
}

/**
 * Calculates password strength (0-100)
 * @param password - The password to check
 * @returns A strength score from 0 to 100
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
  if (/(.)\1{2,}/.test(password)) strength -= 10; // Repeated characters
  if (/^[0-9]+$/.test(password)) strength -= 10; // Numbers only
  if (/^[a-zA-Z]+$/.test(password)) strength -= 10; // Letters only
  
  return Math.max(0, Math.min(100, strength));
}
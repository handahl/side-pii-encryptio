// Import argon2-browser differently to handle Vite bundling issues
let argon2: any;

// Initialize argon2 library
async function initArgon2() {
  if (!argon2) {
    try {
      // Try different import methods for better compatibility
      argon2 = await import('argon2-browser');
      
      // If the default export doesn't work, try the named exports
      if (!argon2.hash || !argon2.ArgonType) {
        const argon2Module = await import('argon2-browser');
        argon2 = argon2Module.default || argon2Module;
      }
      
      // If still no ArgonType, define it manually
      if (!argon2.ArgonType) {
        argon2.ArgonType = {
          Argon2d: 0,
          Argon2i: 1,
          Argon2id: 2
        };
      }
      
      console.log('Argon2 initialized successfully:', {
        hasHash: typeof argon2.hash === 'function',
        hasArgonType: !!argon2.ArgonType,
        ArgonType: argon2.ArgonType
      });
    } catch (error) {
      console.error('Failed to initialize argon2:', error);
      throw new Error('Failed to load cryptographic library. Please refresh the page.');
    }
  }
  return argon2;
}

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
    console.log('Starting encryption process...');
    
    // Initialize argon2 library
    const argon2Lib = await initArgon2();
    
    const settings = getEncryptionSettings();
    console.log('Encryption settings:', settings);
    
    // Step 1: Generate a cryptographically secure 16-byte salt
    const salt = crypto.getRandomValues(new Uint8Array(16));
    console.log('Generated salt:', salt);

    // Step 2: Derive a key using Argon2id with settings from localStorage
    console.log('About to call argon2.hash with type:', argon2Lib.ArgonType.Argon2id);
    
    const keyResult = await argon2Lib.hash({
      pass: secret,
      salt: salt,
      time: settings.iterations,
      mem: settings.memory,
      hashLen: settings.hashLength,
      type: argon2Lib.ArgonType.Argon2id
    });
    
    console.log('Key derivation successful, result type:', typeof keyResult);

    // Convert the derived key hash to Uint8Array
    const derivedKey = new Uint8Array(keyResult.hash);
    console.log('Derived key length:', derivedKey.length);

    // Step 3: Generate a cryptographically secure 12-byte nonce/IV
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    console.log('Generated nonce:', nonce);

    // Step 4: Import the derived key for use with Web Crypto API
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      derivedKey,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    console.log('Crypto key imported successfully');

    // Convert plaintext to Uint8Array
    const plaintextBytes = new TextEncoder().encode(plaintext);
    console.log('Plaintext bytes length:', plaintextBytes.length);

    // Encrypt the plaintext using AES-GCM
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: nonce
      },
      cryptoKey,
      plaintextBytes
    );
    console.log('Encryption successful, ciphertext length:', ciphertext.byteLength);

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
    
    console.log('Encryption completed successfully');
    return base64Payload;
  } catch (error) {
    console.error('Detailed encryption error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // More specific error messages based on the error type
    if (error.message?.includes('load cryptographic library')) {
      throw new Error(error.message);
    } else if (error.message?.includes('memory')) {
      throw new Error('Insufficient memory for key derivation. Try reducing memory settings or closing other browser tabs.');
    } else if (error.name === 'QuotaExceededError') {
      throw new Error('Browser memory quota exceeded. Please close other tabs and try again.');
    } else {
      throw new Error(`Encryption failed: ${error.message || 'Unknown error'}`);
    }
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
    console.log('Starting decryption process...');
    
    // Initialize argon2 library
    const argon2Lib = await initArgon2();
    
    // Step 1: Decode the input from Base64
    const jsonPayload = atob(encryptedPayload);

    // Step 2: Parse the JSON to get salt, nonce, and ciphertext
    const payload = JSON.parse(jsonPayload);
    console.log('Parsed payload version:', payload.v);

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
    console.log('Using decryption params:', params);

    // Step 4: Re-derive the exact same key using the stored salt and parameters
    const keyResult = await argon2Lib.hash({
      pass: secret,
      salt: salt,
      time: params.iterations,
      mem: params.memory,
      hashLen: params.hashLen || params.hashLength,
      type: argon2Lib.ArgonType.Argon2id
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
    
    console.log('Decryption completed successfully');
    return decryptedText;

  } catch (error) {
    console.error('Detailed decryption error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // More specific error messages
    if (error.message?.includes('load cryptographic library')) {
      throw new Error(error.message);
    } else if (error.name === 'OperationError') {
      throw new Error('Decryption failed. Check your secret phrase - it may be incorrect.');
    } else if (error.message?.includes('JSON')) {
      throw new Error('Invalid encrypted data format. Please check your input.');
    } else {
      throw new Error(`Decryption failed: ${error.message || 'Check secret phrase or input data'}`);
    }
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
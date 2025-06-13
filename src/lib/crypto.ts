import * as argon2 from 'argon2-browser';

/**
 * Encrypts plaintext using AES-GCM with a key derived from a secret phrase using Argon2id
 * @param plaintext - The text to encrypt
 * @param secret - The secret phrase to derive the encryption key from
 * @returns A Base64-encoded JSON payload containing salt, nonce, and ciphertext
 */
export async function encryptText(plaintext: string, secret: string): Promise<string> {
  // Step 1: Generate a cryptographically secure 16-byte salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Step 2: Derive a 32-byte (256-bit) key using Argon2id
  const keyResult = await argon2.hash({
    pass: secret,
    salt: salt,
    time: 2,
    mem: 102400,
    hashLen: 32,
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
  const payload = {
    salt: btoa(String.fromCharCode(...salt)),
    nonce: btoa(String.fromCharCode(...nonce)),
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext)))
  };

  // Step 6: JSON.stringify and Base64 encode the entire payload
  const jsonPayload = JSON.stringify(payload);
  const base64Payload = btoa(jsonPayload);

  return base64Payload;
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

    // Step 4: Re-derive the exact same 256-bit key using the stored salt
    const keyResult = await argon2.hash({
      pass: secret,
      salt: salt,
      time: 2,
      mem: 102400,
      hashLen: 32,
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
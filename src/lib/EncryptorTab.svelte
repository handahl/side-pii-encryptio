<script lang="ts">
  import { encryptText, decryptText } from './crypto';
  import { fade } from 'svelte/transition';

  // State variables for form fields
  let plaintext = '';
  let secret = '';
  let ciphertext = '';
  let errorMessage = '';
  let isLoading = false;
  let isEncrypting = false;
  let showResult = false;

  // Handle encryption
  async function handleEncrypt() {
    if (!plaintext.trim()) {
      errorMessage = 'Please enter some text to encrypt.';
      return;
    }
    if (!secret.trim()) {
      errorMessage = 'Please enter a secret phrase.';
      return;
    }

    try {
      isLoading = true;
      isEncrypting = true;
      showResult = false;
      errorMessage = '';
      
      // Add a small delay to show the animation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      ciphertext = await encryptText(plaintext, secret);
      showResult = true;
    } catch (error) {
      errorMessage = 'Encryption failed. Please try again.';
      console.error('Encryption error:', error);
    } finally {
      isLoading = false;
      isEncrypting = false;
    }
  }

  // Handle decryption
  async function handleDecrypt() {
    if (!ciphertext.trim()) {
      errorMessage = 'Please enter encrypted text to decrypt.';
      return;
    }
    if (!secret.trim()) {
      errorMessage = 'Please enter the secret phrase.';
      return;
    }

    try {
      isLoading = true;
      showResult = false;
      errorMessage = '';
      plaintext = await decryptText(ciphertext, secret);
      showResult = true;
    } catch (error) {
      errorMessage = 'Decryption failed. Check your secret phrase or encrypted data.';
      console.error('Decryption error:', error);
    } finally {
      isLoading = false;
    }
  }

  // Clear all fields
  function clearAll() {
    plaintext = '';
    secret = '';
    ciphertext = '';
    errorMessage = '';
    showResult = false;
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h2 class="text-2xl font-bold text-gray-900">Text Encryptor</h2>
    <button
      on:click={clearAll}
      class="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
    >
      Clear All
    </button>
  </div>

  <p class="text-gray-600">
    Securely encrypt and decrypt your sensitive text using AES-GCM encryption with Argon2id key derivation.
  </p>

  <!-- Error Message -->
  {#if errorMessage}
    <div class="bg-red-50 border border-red-200 rounded-md p-4" transition:fade>
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-800">{errorMessage}</p>
        </div>
      </div>
    </div>
  {/if}

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Left Column: Input -->
    <div class="space-y-4">
      <div>
        <label for="plaintext" class="block text-sm font-medium text-gray-700 mb-2">
          Plaintext Input
        </label>
        <textarea
          id="plaintext"
          bind:value={plaintext}
          placeholder="Enter the text you want to encrypt..."
          rows="8"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200"
          class:swoosh-animation={isEncrypting}
        ></textarea>
      </div>

      <div>
        <label for="secret" class="block text-sm font-medium text-gray-700 mb-2">
          Secret Phrase
        </label>
        <input
          type="password"
          id="secret"
          bind:value={secret}
          placeholder="Enter your secret phrase..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          class:swoosh-animation={isEncrypting}
        />
        <p class="mt-1 text-xs text-gray-500">
          Use a strong, memorable phrase. This will be needed to decrypt your data.
        </p>
      </div>

      <div class="flex space-x-3">
        <button
          on:click={handleEncrypt}
          disabled={isLoading}
          class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
        >
          {#if isLoading}
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Encrypting...
          {:else}
            🔒 Encrypt
          {/if}
        </button>
        <button
          on:click={handleDecrypt}
          disabled={isLoading}
          class="flex-1 bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
        >
          {#if isLoading}
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Decrypting...
          {:else}
            🔓 Decrypt
          {/if}
        </button>
      </div>
    </div>

    <!-- Right Column: Output -->
    <div class="space-y-4">
      <div>
        <label for="ciphertext" class="block text-sm font-medium text-gray-700 mb-2">
          Encrypted Output
        </label>
        {#if showResult}
          <textarea
            id="ciphertext"
            bind:value={ciphertext}
            placeholder="Encrypted text will appear here..."
            rows="8"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
            transition:fade={{ duration: 600 }}
          ></textarea>
        {:else}
          <textarea
            id="ciphertext"
            bind:value={ciphertext}
            placeholder="Encrypted text will appear here..."
            rows="8"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
          ></textarea>
        {/if}
        <p class="mt-1 text-xs text-gray-500">
          This encrypted data is safe to store or share. You can also paste encrypted text here to decrypt it.
        </p>
      </div>

      {#if ciphertext && showResult}
        <button
          on:click={() => navigator.clipboard.writeText(ciphertext)}
          class="w-full bg-gray-600 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
          transition:fade={{ duration: 600, delay: 200 }}
        >
          📋 Copy to Clipboard
        </button>
      {/if}
    </div>
  </div>

  <!-- Security Information -->
  <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
    <div class="flex">
      <div class="flex-shrink-0">
        <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
      </div>
      <div class="ml-3">
        <h3 class="text-sm font-medium text-blue-800">Security Information</h3>
        <div class="mt-2 text-sm text-blue-700">
          <ul class="list-disc list-inside space-y-1">
            <li>Uses AES-GCM encryption with 256-bit keys</li>
            <li>Key derivation with Argon2id (memory-hard, GPU-resistant)</li>
            <li>Each encryption uses a unique salt and nonce</li>
            <li>All cryptographic operations happen locally in your browser</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>
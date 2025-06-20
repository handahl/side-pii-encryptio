<script lang="ts">
  // Import the Web Crypto API version instead
  import { encryptText, decryptText } from './crypto-webcrypto';
  import { fade } from 'svelte/transition';

  let inputText = '';
  let secret = '';
  let outputText = '';
  let mode: 'encrypt' | 'decrypt' = 'encrypt';
  let isProcessing = false;
  let errorMessage = '';
  let successMessage = '';

  async function processParagraphs() {
    if (!inputText.trim() || !secret.trim()) {
      errorMessage = 'Please provide both text and secret phrase.';
      return;
    }

    errorMessage = '';
    successMessage = '';
    isProcessing = true;

    try {
      // Split by double newlines to get paragraphs
      const paragraphs = inputText.split(/\n\s*\n/);
      const processed: string[] = [];

      for (const paragraph of paragraphs) {
        if (paragraph.trim()) {
          if (mode === 'encrypt') {
            const encrypted = await encryptText(paragraph.trim(), secret);
            processed.push(encrypted);
          } else {
            const decrypted = await decryptText(paragraph.trim(), secret);
            processed.push(decrypted);
          }
        } else {
          processed.push(''); // Preserve empty paragraphs
        }
      }

      outputText = processed.join('\n\n');
      successMessage = `Successfully ${mode}ed ${processed.filter(p => p).length} paragraph(s)!`;
    } catch (error) {
      errorMessage = `${mode === 'encrypt' ? 'Encryption' : 'Decryption'} failed. ${error.message}`;
    } finally {
      isProcessing = false;
    }
  }

  function clearAll() {
    inputText = '';
    outputText = '';
    errorMessage = '';
    successMessage = '';
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h2 class="text-2xl font-bold text-gray-900">Paragraph Processor</h2>
    <button
      on:click={clearAll}
      class="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
    >
      Clear All
    </button>
  </div>

  <p class="text-gray-600">
    Process multiple paragraphs at once. Each paragraph (separated by blank lines) will be encrypted or decrypted individually.
  </p>

  <!-- Mode Selection -->
  <div class="flex space-x-4">
    <label class="flex items-center">
      <input
        type="radio"
        bind:group={mode}
        value="encrypt"
        class="mr-2"
      />
      <span class="text-gray-700">Encrypt Paragraphs</span>
    </label>
    <label class="flex items-center">
      <input
        type="radio"
        bind:group={mode}
        value="decrypt"
        class="mr-2"
      />
      <span class="text-gray-700">Decrypt Paragraphs</span>
    </label>
  </div>

  <!-- Messages -->
  {#if errorMessage}
    <div class="bg-red-50 border border-red-200 rounded-md p-4" transition:fade>
      <p class="text-sm text-red-800">{errorMessage}</p>
    </div>
  {/if}

  {#if successMessage}
    <div class="bg-green-50 border border-green-200 rounded-md p-4" transition:fade>
      <p class="text-sm text-green-800">{successMessage}</p>
    </div>
  {/if}

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Input Column -->
    <div class="space-y-4">
      <div>
        <label for="input-paragraphs" class="block text-sm font-medium text-gray-700 mb-2">
          {mode === 'encrypt' ? 'Plaintext Paragraphs' : 'Encrypted Paragraphs'}
        </label>
        <textarea
          id="input-paragraphs"
          bind:value={inputText}
          placeholder={mode === 'encrypt' 
            ? "Enter paragraphs separated by blank lines...\n\nLike this..." 
            : "Paste encrypted paragraphs here..."}
          rows="12"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200"
        ></textarea>
      </div>

      <div>
        <label for="batch-secret" class="block text-sm font-medium text-gray-700 mb-2">
          Secret Phrase
        </label>
        <input
          type="password"
          id="batch-secret"
          bind:value={secret}
          placeholder="Enter your secret phrase..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
        />
      </div>

      <button
        on:click={processParagraphs}
        disabled={isProcessing}
        class="w-full bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        {#if isProcessing}
          <span class="inline-flex items-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        {:else}
          {mode === 'encrypt' ? '🔒 Encrypt All' : '🔓 Decrypt All'}
        {/if}
      </button>
    </div>

    <!-- Output Column -->
    <div class="space-y-4">
      <div>
        <label for="output-paragraphs" class="block text-sm font-medium text-gray-700 mb-2">
          {mode === 'encrypt' ? 'Encrypted Output' : 'Decrypted Output'}
        </label>
        <textarea
          id="output-paragraphs"
          bind:value={outputText}
          placeholder="Processed paragraphs will appear here..."
          rows="12"
          readonly
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 font-mono text-sm resize-none"
        ></textarea>
      </div>

      {#if outputText}
        <button
          on:click={() => {
            navigator.clipboard.writeText(outputText);
            successMessage = 'Copied to clipboard!';
            setTimeout(() => successMessage = '', 2000);
          }}
          class="w-full bg-gray-600 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
        >
          📋 Copy All to Clipboard
        </button>
      {/if}
    </div>
  </div>

  <!-- Info Box -->
  <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
    <h3 class="text-sm font-medium text-blue-800 mb-2">How it works</h3>
    <ul class="text-sm text-blue-700 space-y-1">
      <li>• Each paragraph is encrypted/decrypted separately</li>
      <li>• Paragraphs are separated by blank lines</li>
      <li>• Empty paragraphs are preserved in the output</li>
      <li>• Use the same secret phrase for all paragraphs in a batch</li>
    </ul>
  </div>
</div>
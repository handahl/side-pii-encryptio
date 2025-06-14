<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  // Settings interface
  interface Settings {
    encryption: {
      iterations: number;
      memory: number;
      hashLength: number;
    };
    ui: {
      theme: 'light' | 'dark' | 'auto';
      autoClearTimeout: number; // in seconds, 0 = disabled
      showPasswordStrength: boolean;
    };
    security: {
      confirmBeforeDecrypt: boolean;
      warnWeakPasswords: boolean;
      clipboardAutoClear: number; // in seconds, 0 = disabled
    };
  }

  // Default settings
  const defaultSettings: Settings = {
    encryption: {
      iterations: 2,
      memory: 102400, // 100 MB
      hashLength: 32
    },
    ui: {
      theme: 'light',
      autoClearTimeout: 0,
      showPasswordStrength: true
    },
    security: {
      confirmBeforeDecrypt: false,
      warnWeakPasswords: true,
      clipboardAutoClear: 30
    }
  };

  let settings: Settings = { ...defaultSettings };
  let saveMessage = '';
  let importExportData = '';
  let showImportExport = false;

  // Load settings from localStorage on mount
  onMount(() => {
    const saved = localStorage.getItem('pii-shield-settings');
    if (saved) {
      try {
        settings = { ...defaultSettings, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
    applyTheme();
  });

  // Save settings to localStorage
  function saveSettings() {
    localStorage.setItem('pii-shield-settings', JSON.stringify(settings));
    saveMessage = 'Settings saved successfully!';
    applyTheme();
    setTimeout(() => saveMessage = '', 3000);
  }

  // Reset to defaults
  function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      settings = { ...defaultSettings };
      saveSettings();
    }
  }

  // Apply theme
  function applyTheme() {
    const root = document.documentElement;
    if (settings.ui.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.ui.theme === 'auto') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } else {
      root.classList.remove('dark');
    }
  }

  // Export settings
  function exportSettings() {
    importExportData = JSON.stringify(settings, null, 2);
    showImportExport = true;
  }

  // Deep merge utility for settings objects
  function deepMerge(target: any, source: any): any {
    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key])
      ) {
        target[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  // Import settings
  function importSettings() {
    try {
      const imported = JSON.parse(importExportData);
      settings = deepMerge({ ...defaultSettings }, imported);
      saveSettings();
      showImportExport = false;
      importExportData = '';
    } catch (e) {
      alert('Invalid settings format. Please check your JSON.');
    }
  }

  // Copy settings to clipboard
  function copySettings() {
    navigator.clipboard.writeText(importExportData);
    saveMessage = 'Settings copied to clipboard!';
    setTimeout(() => saveMessage = '', 3000);
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h2 class="text-2xl font-bold text-gray-900">Settings</h2>
    <div class="flex space-x-2">
      <button
        on:click={resetSettings}
        class="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
      >
        Reset to Defaults
      </button>
      <button
        on:click={saveSettings}
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-200"
      >
        Save Settings
      </button>
    </div>
  </div>

  {#if saveMessage}
    <div class="bg-green-50 border border-green-200 rounded-md p-4" transition:fade>
      <p class="text-sm text-green-800">{saveMessage}</p>
    </div>
  {/if}

  <!-- Encryption Settings -->
  <div class="bg-white rounded-lg border border-gray-200 p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Encryption Parameters</h3>
    <div class="space-y-4">
      <div>
        <label for="iterations" class="block text-sm font-medium text-gray-700 mb-1">
          Argon2 Iterations
        </label>
        <div class="flex items-center space-x-3">
          <input
            type="range"
            id="iterations"
            bind:value={settings.encryption.iterations}
            min="1"
            max="10"
            class="flex-1"
          />
          <span class="text-sm text-gray-600 w-8">{settings.encryption.iterations}</span>
        </div>
        <p class="mt-1 text-xs text-gray-500">Higher values increase security but take longer to compute</p>
      </div>

      <div>
        <label for="memory" class="block text-sm font-medium text-gray-700 mb-1">
          Memory Cost (KB)
        </label>
        <div class="flex items-center space-x-3">
          <input
            type="range"
            id="memory"
            bind:value={settings.encryption.memory}
            min="51200"
            max="204800"
            step="25600"
            class="flex-1"
          />
          <span class="text-sm text-gray-600 w-16">{(settings.encryption.memory / 1024).toFixed(0)} MB</span>
        </div>
        <p class="mt-1 text-xs text-gray-500">More memory makes GPU attacks harder</p>
      </div>

      <div>
        <label for="hashLength" class="block text-sm font-medium text-gray-700 mb-1">
          Key Length (bytes)
        </label>
        <select
          id="hashLength"
          bind:value={settings.encryption.hashLength}
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value={16}>128-bit (16 bytes)</option>
          <option value={32}>256-bit (32 bytes) - Recommended</option>
          <option value={64}>512-bit (64 bytes)</option>
        </select>
      </div>
    </div>
  </div>

  <!-- UI Preferences -->
  <div class="bg-white rounded-lg border border-gray-200 p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Interface Preferences</h3>
    <div class="space-y-4">
      <div>
        <label for="theme" class="block text-sm font-medium text-gray-700 mb-1">
          Theme
        </label>
        <select
          id="theme"
          bind:value={settings.ui.theme}
          on:change={applyTheme}
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="auto">Auto (System)</option>
        </select>
      </div>

      <div>
        <label for="autoClear" class="block text-sm font-medium text-gray-700 mb-1">
          Auto-clear Forms (seconds)
        </label>
        <div class="flex items-center space-x-3">
          <input
            type="range"
            id="autoClear"
            bind:value={settings.ui.autoClearTimeout}
            min="0"
            max="300"
            step="30"
            class="flex-1"
          />
          <span class="text-sm text-gray-600 w-16">
            {settings.ui.autoClearTimeout === 0 ? 'Off' : `${settings.ui.autoClearTimeout}s`}
          </span>
        </div>
        <p class="mt-1 text-xs text-gray-500">Automatically clear sensitive data after inactivity</p>
      </div>

      <div>
        <label class="flex items-center">
          <input
            type="checkbox"
            bind:checked={settings.ui.showPasswordStrength}
            class="mr-2"
          />
          <span class="text-sm text-gray-700">Show password strength indicator</span>
        </label>
      </div>
    </div>
  </div>

  <!-- Security Settings -->
  <div class="bg-white rounded-lg border border-gray-200 p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Security Options</h3>
    <div class="space-y-4">
      <div>
        <label class="flex items-center">
          <input
            type="checkbox"
            bind:checked={settings.security.confirmBeforeDecrypt}
            class="mr-2"
          />
          <span class="text-sm text-gray-700">Require confirmation before decryption</span>
        </label>
      </div>

      <div>
        <label class="flex items-center">
          <input
            type="checkbox"
            bind:checked={settings.security.warnWeakPasswords}
            class="mr-2"
          />
          <span class="text-sm text-gray-700">Warn about weak passwords</span>
        </label>
      </div>

      <div>
        <label for="clipboardClear" class="block text-sm font-medium text-gray-700 mb-1">
          Clear Clipboard After (seconds)
        </label>
        <div class="flex items-center space-x-3">
          <input
            type="range"
            id="clipboardClear"
            bind:value={settings.security.clipboardAutoClear}
            min="0"
            max="120"
            step="10"
            class="flex-1"
          />
          <span class="text-sm text-gray-600 w-16">
            {settings.security.clipboardAutoClear === 0 ? 'Off' : `${settings.security.clipboardAutoClear}s`}
          </span>
        </div>
        <p class="mt-1 text-xs text-gray-500">Automatically clear clipboard after copying encrypted data</p>
      </div>
    </div>
  </div>

  <!-- Import/Export -->
  <div class="bg-white rounded-lg border border-gray-200 p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Import/Export Settings</h3>
    <div class="space-y-4">
      <div class="flex space-x-2">
        <button
          on:click={exportSettings}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
        >
          Export Settings
        </button>
        <button
          on:click={() => showImportExport = !showImportExport}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
        >
          {showImportExport ? 'Hide' : 'Import Settings'}
        </button>
      </div>

      {#if showImportExport}
        <div transition:fade>
          <textarea
            bind:value={importExportData}
            placeholder="Paste settings JSON here to import, or copy the exported settings..."
            rows="10"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs"
          ></textarea>
          <div class="mt-2 flex space-x-2">
            <button
              on:click={importSettings}
              disabled={!importExportData}
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Import
            </button>
            <button
              on:click={copySettings}
              disabled={!importExportData}
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Copy to Clipboard
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- About -->
  <div class="bg-blue-50 border border-blue-200 rounded-md p-6">
    <h3 class="text-lg font-semibold text-blue-900 mb-2">About PII Shield</h3>
    <div class="text-sm text-blue-800 space-y-2">
      <p>Version 1.0.0 - Built with privacy in mind</p>
      <p>• All encryption happens locally in your browser</p>
      <p>• No data is ever sent to any server</p>
      <p>• Uses industry-standard AES-GCM encryption with Argon2id key derivation</p>
      <p>• Open source and auditable</p>
    </div>
  </div>
</div>
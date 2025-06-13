<script lang="ts">
  import EncryptorTab from './lib/EncryptorTab.svelte';

  // State to track the currently active tab
  let activeTab: 'encryptor' | 'paragraph' | 'settings' = 'encryptor';

  // Function to handle tab switching
  function setActiveTab(tab: 'encryptor' | 'paragraph' | 'settings') {
    activeTab = tab;
  }
</script>

<main class="min-h-screen bg-gray-50">
  <!-- Navigation Bar -->
  <nav class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex space-x-8">
        <!-- Encryptor Tab -->
        <button
          on:click={() => setActiveTab('encryptor')}
          class="py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 {activeTab === 'encryptor' 
            ? 'border-blue-500 text-blue-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        >
          Encryptor
        </button>

        <!-- Paragraph Processor Tab -->
        <button
          on:click={() => setActiveTab('paragraph')}
          class="py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 {activeTab === 'paragraph' 
            ? 'border-blue-500 text-blue-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        >
          Paragraph Processor
        </button>

        <!-- Settings Tab -->
        <button
          on:click={() => setActiveTab('settings')}
          class="py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 {activeTab === 'settings' 
            ? 'border-blue-500 text-blue-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        >
          Settings
        </button>
      </div>
    </div>
  </nav>

  <!-- Content Area -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if activeTab === 'encryptor'}
      <div class="bg-white rounded-lg shadow-sm p-6">
        <EncryptorTab />
      </div>
    {:else if activeTab === 'paragraph'}
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Paragraph Processor</h2>
        <p class="text-gray-600">Process and protect paragraphs of text with advanced encryption.</p>
      </div>
    {:else if activeTab === 'settings'}
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Settings</h2>
        <p class="text-gray-600">Configure your encryption preferences and security settings.</p>
      </div>
    {/if}
  </div>
</main>
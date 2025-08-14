<script lang="ts">
  let email = 'cajero@empresa.com';
  let password = 'password123';
  let loading = false;
  let result = '';
  let error = '';

  async function testAuth() {
    loading = true;
    error = '';
    result = '';
    
    try {
      const response = await fetch('/api/test-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        result = JSON.stringify(data, null, 2);
      } else {
        error = JSON.stringify(data, null, 2);
      }
    } catch (err) {
      error = `Network error: ${err}`;
    } finally {
      loading = false;
    }
  }
</script>

<div class="container mx-auto p-6">
  <h1 class="text-2xl font-bold mb-6">Test de Autenticación</h1>
  
  <div class="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Email:
      </label>
      <input 
        type="email" 
        bind:value={email}
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
    
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Password:
      </label>
      <input 
        type="password" 
        bind:value={password}
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
    
    <button 
      on:click={testAuth}
      disabled={loading}
      class="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
    >
      {loading ? 'Probando...' : 'Probar Autenticación'}
    </button>
  </div>
  
  {#if result}
    <div class="mt-6 max-w-4xl mx-auto">
      <h2 class="text-lg font-semibold text-green-600 mb-2">Resultado Exitoso:</h2>
      <pre class="bg-green-50 p-4 rounded-md overflow-auto text-sm">{result}</pre>
    </div>
  {/if}
  
  {#if error}
    <div class="mt-6 max-w-4xl mx-auto">
      <h2 class="text-lg font-semibold text-red-600 mb-2">Error:</h2>
      <pre class="bg-red-50 p-4 rounded-md overflow-auto text-sm">{error}</pre>
    </div>
  {/if}
</div>
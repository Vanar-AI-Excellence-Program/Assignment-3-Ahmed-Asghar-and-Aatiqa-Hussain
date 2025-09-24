<script lang="ts">
  import { signIn } from '@auth/sveltekit/client';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';

  export let mode: 'login' | 'register' = 'login';
  export let onSubmit: (data: any) => void = () => {};
  export let loading = false;
  export let error = '';

  let formData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    accountType: 'user'
  };

  function handleSubmit() {
    if (mode === 'register' && formData.password !== formData.confirmPassword) {
      error = 'Passwords do not match';
      return;
    }
    
    const data = mode === 'login' 
      ? { email: formData.email, password: formData.password, accountType: formData.accountType }
      : { name: formData.name, email: formData.email, password: formData.password, accountType: formData.accountType };
    
    onSubmit(data);
  }

  async function handleSocialLogin(provider: 'google' | 'github') {
    try {
      console.log(`Initiating ${provider} sign in...`);
      
      // Use window.location.href for direct redirect
      const result = await signIn(provider, { 
        callbackUrl: '/',
        redirect: false 
      });
      
      console.log(`${provider} sign in result:`, result);
      
      if (result?.url) {
        console.log(`Redirecting to: ${result.url}`);
        // Redirect to the OAuth provider
        window.location.href = result.url;
      } else {
        console.error(`No URL returned from ${provider} sign in`);
        error = `Failed to initiate ${provider} sign in`;
      }
    } catch (err) {
      console.error(`Error signing in with ${provider}:`, err);
      error = `Failed to sign in with ${provider}`;
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-white to-indigo-50 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center px-6 py-16">
  <div class="w-full max-w-md">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          {mode === 'login' ? 'Sign in to your account' : 'Join us today'}
        </p>
      </div>

      {#if error}
        <div class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p class="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      {/if}

      <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        {#if mode === 'register'}
          <Input
            label="Full Name"
            type="text"
            bind:value={formData.name}
            required
          />
        {/if}

        <Input
          label="Email"
          type="email"
          bind:value={formData.email}
          required
        />

        <Input
          label="Password"
          type="password"
          bind:value={formData.password}
          required
        />

        {#if mode === 'register'}
          <Input
            label="Confirm Password"
            type="password"
            bind:value={formData.confirmPassword}
            required
          />
        {/if}

        <!-- Account Type Toggle -->
        <fieldset class="space-y-2">
          <legend class="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Type</legend>
          <div class="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1" role="radiogroup" aria-labelledby="account-type-label">
            <input
              type="radio"
              id="account-type-user"
              name="accountType"
              value="user"
              bind:group={formData.accountType}
              class="sr-only"
            />
            <label
              for="account-type-user"
              class="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors cursor-pointer
                {formData.accountType === 'user' 
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}"
            >
              User
            </label>
            <input
              type="radio"
              id="account-type-admin"
              name="accountType"
              value="admin"
              bind:group={formData.accountType}
              class="sr-only"
            />
            <label
              for="account-type-admin"
              class="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors cursor-pointer
                {formData.accountType === 'admin' 
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}"
            >
              Admin
            </label>
          </div>
        </fieldset>

        <Button
          type="submit"
          variant="primary"
          fullWidth={true}
          disabled={loading}
        >
          {#if loading}
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          {/if}
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </Button>
      </form>

      {#if mode === 'login'}
        <div class="mt-4 text-center space-y-2">
          <div>
            <a href="/reset-password" class="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
              Forgot your password?
            </a>
          </div>
          <div>
            <a href="/verify-otp" class="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
              Need to verify your email?
            </a>
          </div>
        </div>
      {/if}

      <!-- Social Login -->
      <div class="mt-6">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white dark:bg-gray-800 text-gray-500">Or continue with</span>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            fullWidth={true}
            on:click={() => handleSocialLogin('google')}
          >
            <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </Button>
          <Button
            variant="secondary"
            fullWidth={true}
            on:click={() => handleSocialLogin('github')}
          >
            <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.262.82-.582 0-.288-.012-1.243-.017-2.25-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.606-2.665-.304-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.236-3.22-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23.96-.267 1.98-.399 3-.404 1.02.005 2.04.137 3 .404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.12 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.803 5.624-5.475 5.921.43.372.823 1.104.823 2.227 0 1.606-.015 2.898-.015 3.293 0 .322.218.699.825.58C20.565 21.796 24 17.297 24 12c0-6.63-5.373-12-12-12z"/>
            </svg>
            GitHub
          </Button>
        </div>
      </div>

      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
          <a 
            href={mode === 'login' ? '/register' : '/login'} 
            class="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 ml-1"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </a>
        </p>
      </div>
    </div>
  </div>
</div>

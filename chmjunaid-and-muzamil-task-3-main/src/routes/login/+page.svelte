<script lang="ts">
  import { signIn } from '@auth/sveltekit/client';
  import { goto } from '$app/navigation';
  import { invalidate } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';

  let loading = false;
  let error = '';
  let formData = {
    email: '',
    password: ''
  };

  async function handleSubmit() {
    loading = true;
    error = '';

    try {
      // Use custom credentials endpoint that creates database sessions
      const response = await fetch('/auth/credentials-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error.includes('verify your email')) {
          goto(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
          return;
        }
        error = result.error;
        return;
      }

      // Invalidate and redirect on success
      await invalidate('app:auth');
      goto('/');
    } catch (err) {
      console.error('Login error:', err);
      error = 'An error occurred during sign in';
    } finally {
      loading = false;
    }
  }

  async function handleSocialLogin(provider: 'google' | 'github') {
    try {
      await signIn(provider, { callbackUrl: '/', redirect: true });
    } catch (err) {
      console.error(`Error signing in with ${provider}:`, err);
      error = `Failed to sign in with ${provider}`;
    }
  }
</script>

<div class="min-h-screen bg-gray-900 flex items-center justify-center px-6 py-16">
  <div class="w-full max-w-md">
    <div class="card p-8">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">
          Welcome Back
        </h1>
        <p class="text-gray-400">
          Sign in to your account
        </p>
      </div>

      {#if error}
        <div class="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p class="text-red-400 text-sm">{error}</p>
        </div>
      {/if}

      <form on:submit|preventDefault={handleSubmit} class="space-y-6">
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

        <Button
          type="submit"
          variant="primary"
          fullWidth={true}
          disabled={loading}
        >
          {#if loading}
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          {/if}
          Sign In
        </Button>
      </form>

      <div class="mt-4 text-center space-y-2">
        <div>
          <a href="/reset-password" class="text-sm text-orange-400 hover:text-orange-300 transition-colors">
            Forgot your password?
          </a>
        </div>
        <div>
          <a href="/verify-otp" class="text-sm text-orange-400 hover:text-orange-300 transition-colors">
            Need to verify your email?
          </a>
        </div>
      </div>

      <!-- Social Login -->
      <div class="mt-6">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-600"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-gray-800 text-gray-400">Or continue with</span>
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
        <p class="text-sm text-gray-400">
          Don't have an account?
          <a 
            href="/register" 
            class="font-medium text-orange-400 hover:text-orange-300 ml-1 transition-colors"
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  </div>
</div>
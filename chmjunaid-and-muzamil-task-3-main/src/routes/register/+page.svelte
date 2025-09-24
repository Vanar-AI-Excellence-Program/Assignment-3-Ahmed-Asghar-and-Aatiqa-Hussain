<script lang="ts">
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';

  let loading = false;
  let error = '';
  let formData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  async function handleSubmit() {
    if (formData.password !== formData.confirmPassword) {
      error = 'Passwords do not match';
      return;
    }

    loading = true;
    error = '';

    try {
      const res = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      });

      const result = await res.json();

      if (res.ok) {
        // Registration successful, redirect to OTP verification
        goto(`/verify-otp?userId=${result.userId}`);
      } else {
        error = result.error || 'Registration failed';
      }
    } catch (err) {
      error = 'An error occurred during registration';
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen bg-gray-900 flex items-center justify-center px-6 py-16">
  <div class="w-full max-w-md">
    <div class="card p-8">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">
          Create Account
        </h1>
        <p class="text-gray-400">
          Join us today as a regular user
        </p>
      </div>

      {#if error}
        <div class="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p class="text-red-400 text-sm">{error}</p>
        </div>
      {/if}

      <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        <Input
          label="Full Name"
          type="text"
          bind:value={formData.name}
          required
        />

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

        <Input
          label="Confirm Password"
          type="password"
          bind:value={formData.confirmPassword}
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
          Create Account
        </Button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-sm text-gray-400">
          Already have an account?
          <a 
            href="/login" 
            class="font-medium text-orange-400 hover:text-orange-300 ml-1 transition-colors"
          >
            Sign in
          </a>
        </p>
        <p class="text-sm text-gray-400 mt-2">
          Need to register as an admin?
          <a 
            href="/register/admin" 
            class="font-medium text-orange-400 hover:text-orange-300 ml-1 transition-colors"
          >
            Admin Registration
          </a>
        </p>
      </div>
    </div>
  </div>
</div>
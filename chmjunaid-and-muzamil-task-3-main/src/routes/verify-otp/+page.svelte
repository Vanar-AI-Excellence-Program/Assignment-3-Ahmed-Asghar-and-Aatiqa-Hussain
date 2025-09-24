<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  let otp = '';
  let email = '';
  let loading = false;
  let error = '';
  let success = '';
  let countdown = 600; // 10 minutes in seconds
  let timer: NodeJS.Timeout;
  let showEmailForm = true;
  
  // Get user ID from URL params
  let userId: string;
  
  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    userId = urlParams.get('userId') || '';
    const emailFromUrl = urlParams.get('email') || '';
    
    if (userId) {
      showEmailForm = false;
      startCountdown();
    } else if (emailFromUrl) {
      email = emailFromUrl;
      // Auto-submit email to get OTP
      handleEmailSubmit();
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  });
  
  function startCountdown() {
    // Start countdown timer
    timer = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        clearInterval(timer);
        error = 'OTP has expired. Please request a new one.';
      }
    }, 1000);
  }
  
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  async function handleEmailSubmit() {
    if (!email) {
      error = 'Please enter your email address.';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      const response = await fetch('/request-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        success = 'OTP sent to your email! Please check your inbox.';
        userId = result.userId;
        showEmailForm = false;
        countdown = 600;
        startCountdown();
      } else {
        error = result.error || 'Failed to send OTP. Please try again.';
      }
    } catch (err) {
      error = 'An error occurred. Please try again.';
    } finally {
      loading = false;
    }
  }
  
  async function handleSubmit() {
    if (!otp || otp.length !== 6) {
      error = 'Please enter a valid 6-digit OTP.';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      const response = await fetch('/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ otp, userId })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        success = 'Email verified successfully! You can now log in.';
        setTimeout(() => {
          goto('/login');
        }, 2000);
      } else {
        error = result.error || 'Verification failed. Please try again.';
      }
    } catch (err) {
      error = 'An error occurred. Please try again.';
    } finally {
      loading = false;
    }
  }
  
  async function resendOTP() {
    if (!userId) return;
    
    loading = true;
    error = '';
    
    try {
      const response = await fetch('/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        success = 'New OTP sent to your email!';
        countdown = 600; // Reset countdown
        // Restart timer
        if (timer) clearInterval(timer);
        startCountdown();
      } else {
        error = result.error || 'Failed to resend OTP. Please try again.';
      }
    } catch (err) {
      error = 'An error occurred. Please try again.';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
      <title>Verify OTP - Authenra</title>
</svelte:head>

<div class="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <div class="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
      <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    </div>
    <h2 class="text-center text-3xl font-bold text-white">
      Verify Your Email
    </h2>
    <p class="mt-2 text-center text-sm text-gray-400">
      {showEmailForm ? 'Enter your email to receive a verification OTP' : 'Enter the 6-digit OTP sent to your email'}
    </p>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="card py-8 px-4 sm:px-10">
      {#if error}
        <div class="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      {/if}
      
      {#if success}
        <div class="mb-4 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg">
          {success}
        </div>
      {/if}
      
      {#if showEmailForm}
        <!-- Email Form -->
        <form class="space-y-6" on:submit|preventDefault={handleEmailSubmit}>
          <div>
            <label for="email" class="block text-sm font-semibold text-gray-300">
              Email Address
            </label>
            <div class="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                required
                bind:value={email}
                class="input-field"
                placeholder="Enter your email address"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              class="btn-primary w-full"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </div>
        </form>
      {:else}
        <!-- OTP Form -->
        <form class="space-y-6" on:submit|preventDefault={handleSubmit}>
          <div>
            <label for="otp" class="block text-sm font-semibold text-gray-300">
              OTP Code
            </label>
            <div class="mt-1">
              <input
                id="otp"
                name="otp"
                type="text"
                maxlength="6"
                inputmode="numeric"
                required
                bind:value={otp}
                class="input-field"
                placeholder="Enter 6-digit OTP"
                disabled={loading}
                on:input={(e) => {
                  // Only allow numbers
                  const target = e.target as HTMLInputElement;
                  otp = target.value.replace(/\D/g, '').slice(0, 6);
                }}
              />
            </div>
          </div>

          <div class="text-center">
            <p class="text-sm text-gray-400">
              Time remaining: <span class="font-mono font-bold {countdown <= 60 ? 'text-red-400' : 'text-white'}">{formatTime(countdown)}</span>
            </p>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || countdown <= 0}
              class="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>
        </form>

        <div class="mt-6 text-center">
          <button
            type="button"
            on:click={resendOTP}
            disabled={loading || countdown > 0}
            class="text-sm text-orange-400 hover:text-orange-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Didn't receive OTP? Resend
          </button>
        </div>
      {/if}

      <div class="mt-6 text-center">
        <a href="/login" class="text-sm text-gray-400 hover:text-gray-300 transition-colors">
          Back to Login
        </a>
      </div>
    </div>
  </div>
</div>

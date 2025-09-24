<script lang="ts">
  /** @type {import('./$types').PageData} */
  export let data;
  
  /** @type {any} */
  $: user = data.user;
  
  let name = user?.name || '';
  let error = '';
  let success = '';
  
  // Password update variables
  let currentPassword = '';
  let newPassword = '';
  let confirmPassword = '';
  let passwordError = '';
  let passwordSuccess = '';
  let showPasswordForm = false;

  async function updateProfile(e: Event) {
    e.preventDefault();
    error = '';
    success = '';
    
    try {
      const res = await fetch('/profile/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      
      const result = await res.json();
      
      if (res.ok) {
        success = 'Profile updated successfully!';
      } else {
        error = result.error || 'Update failed.';
      }
    } catch (err) {
      error = 'An error occurred while updating your profile.';
    }
  }

  async function updatePassword(e: Event) {
    e.preventDefault();
    passwordError = '';
    passwordSuccess = '';
    
    if (newPassword.length < 6) {
      passwordError = 'New password must be at least 6 characters long';
      return;
    }
    
    if (newPassword !== confirmPassword) {
      passwordError = 'New passwords do not match';
      return;
    }
    
    try {
      const res = await fetch('/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentPassword, 
          newPassword 
        })
      });
      
      const result = await res.json();
      
      if (res.ok) {
        passwordSuccess = 'Password updated successfully!';
        // Clear form
        currentPassword = '';
        newPassword = '';
        confirmPassword = '';
        showPasswordForm = false;
      } else {
        passwordError = result.error || 'Password update failed.';
      }
    } catch (err) {
      passwordError = 'An error occurred while updating your password.';
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
        <h1 class="text-3xl font-bold text-white mb-2">Profile Settings</h1>
        <p class="text-gray-400">Update your account information</p>
      </div>

      {#if error}
        <div class="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p class="text-red-400 text-sm">{error}</p>
        </div>
      {/if}

      {#if success}
        <div class="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p class="text-green-400 text-sm">{success}</p>
        </div>
      {/if}

      <form on:submit|preventDefault={updateProfile} class="space-y-6">
        <div>
          <label for="name" class="block text-sm font-semibold text-gray-300 mb-2">
            Full Name
          </label>
          <input 
            id="name"
            type="text" 
            bind:value={name}
            placeholder={user?.name || "Enter your full name"}
            class="input-field"
            required
          />
        </div>

        <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 class="text-sm font-semibold text-gray-300 mb-2">Account Information</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-400">Role:</span>
              <span class="font-medium text-white capitalize">{user?.role || 'User'}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Email Verified:</span>
              <span class="font-medium {user?.emailVerified ? 'text-green-400' : 'text-yellow-400'}">
                {user?.emailVerified ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        <button 
          type="submit"
          class="btn-primary w-full"
        >
          Update Profile
        </button>
      </form>

      <!-- Password Update Section -->
      <div class="mt-8 pt-8 border-t border-gray-700">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-white">Change Password</h3>
          <button
            type="button"
            on:click={() => showPasswordForm = !showPasswordForm}
            class="text-sm text-orange-400 hover:text-orange-300 transition-colors"
          >
            {showPasswordForm ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {#if showPasswordForm}
          {#if passwordError}
            <div class="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p class="text-red-400 text-sm">{passwordError}</p>
            </div>
          {/if}

          {#if passwordSuccess}
            <div class="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p class="text-green-400 text-sm">{passwordSuccess}</p>
            </div>
          {/if}

          <form on:submit|preventDefault={updatePassword} class="space-y-4">
            <div>
              <label for="currentPassword" class="block text-sm font-semibold text-gray-300 mb-2">
                Current Password
              </label>
              <input 
                id="currentPassword"
                type="password" 
                bind:value={currentPassword}
                placeholder="Enter your current password"
                class="input-field"
                required
              />
            </div>

            <div>
              <label for="newPassword" class="block text-sm font-semibold text-gray-300 mb-2">
                New Password
              </label>
              <input 
                id="newPassword"
                type="password" 
                bind:value={newPassword}
                placeholder="Enter your new password"
                class="input-field"
                required
              />
            </div>

            <div>
              <label for="confirmPassword" class="block text-sm font-semibold text-gray-300 mb-2">
                Confirm New Password
              </label>
              <input 
                id="confirmPassword"
                type="password" 
                bind:value={confirmPassword}
                placeholder="Confirm your new password"
                class="input-field"
                required
              />
            </div>

            <button 
              type="submit"
              class="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Update Password
            </button>
          </form>
        {/if}
      </div>

      <div class="mt-6 text-center">
        <a href="/dashboard" class="text-sm text-orange-400 hover:text-orange-300 transition-colors">
          ← Back to Dashboard
        </a>
      </div>
    </div>
  </div>
</div>
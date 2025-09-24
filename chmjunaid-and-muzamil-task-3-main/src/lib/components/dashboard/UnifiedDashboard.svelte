<script lang="ts">
  import { signOut } from '@auth/sveltekit/client';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Notification from '$lib/components/ui/Notification.svelte';
  import { onMount } from 'svelte';

  export let user: any;
  export let isAdmin: boolean = false;

  let editingName = false;
  let newName = '';
  let isSaving = false;
  let saveMessage = '';
  let showPasswordForm = false;
  let currentPassword = '';
  let newPassword = '';
  let confirmPassword = '';
  let passwordError = '';
  let isChangingPassword = false;
  let notification: { show: boolean; type: 'success' | 'error' | 'warning' | 'info'; message: string } = { show: false, type: 'info', message: '' };
  
  // Delete account state
  let showDeleteAccountForm = false;
  let deleteAccountPassword = '';
  let isDeletingAccount = false;
  let deleteAccountError = '';

  onMount(() => {
    newName = user?.name || '';
  });

  function getInitials(name: string): string {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  async function handleSaveName() {
    if (!newName.trim() || newName === user.name) {
      editingName = false;
      return;
    }

    isSaving = true;
    saveMessage = '';

    try {
      const response = await fetch('/profile/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (response.ok) {
        user.name = newName.trim();
        notification = { show: true, type: 'success', message: 'Name updated successfully!' };
        setTimeout(() => {
          editingName = false;
        }, 1000);
      } else {
        const error = await response.json();
        notification = { show: true, type: 'error', message: error.message || 'Failed to update name' };
      }
    } catch (error) {
      notification = { show: true, type: 'error', message: 'An error occurred while updating your name' };
    } finally {
      isSaving = false;
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      passwordError = 'All fields are required';
      return;
    }

    if (newPassword !== confirmPassword) {
      passwordError = 'New passwords do not match';
      return;
    }

    if (newPassword.length < 6) {
      passwordError = 'Password must be at least 6 characters long';
      return;
    }

    isChangingPassword = true;
    passwordError = '';

    try {
      const response = await fetch('/profile/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (response.ok) {
        passwordError = '';
        currentPassword = '';
        newPassword = '';
        confirmPassword = '';
        showPasswordForm = false;
        notification = { show: true, type: 'success', message: 'Password changed successfully!' };
      } else {
        const error = await response.json();
        passwordError = error.message || 'Failed to change password';
      }
    } catch (error) {
      passwordError = 'An error occurred while changing password';
    } finally {
      isChangingPassword = false;
    }
  }

  function handleSignOut() {
    signOut({ callbackUrl: '/login', redirect: true });
  }

  async function handleDeleteAccount() {
    if (!deleteAccountPassword) {
      deleteAccountError = 'Password is required';
      return;
    }

    isDeletingAccount = true;
    deleteAccountError = '';

    try {
      const response = await fetch('/profile/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: deleteAccountPassword,
        }),
      });

      if (response.ok) {
        notification = { show: true, type: 'success', message: 'Account deleted successfully. You will be redirected to the login page.' };
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          signOut({ callbackUrl: '/login', redirect: true });
        }, 2000);
      } else {
        const error = await response.json();
        deleteAccountError = error.error || 'Failed to delete account';
      }
    } catch (error) {
      deleteAccountError = 'An error occurred while deleting your account';
    } finally {
      isDeletingAccount = false;
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
  <!-- Main Content -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         <!-- Welcome Section -->
     <div class="mb-8">
       <div class="space-y-4">
         <h1 class="text-4xl lg:text-5xl font-bold text-white">
           Welcome back, {user?.name || 'User'}!
         </h1>
         <p class="text-gray-400 text-lg">
           Manage your account and stay updated with your activity
           {#if isAdmin}
             <span class="text-orange-400 font-medium">(Admin)</span>
           {/if}
         </p>
       </div>
     </div>

         <!-- Account Overview Cards -->
     <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
               <!-- Profile Status -->
        <Card variant="elevated" padding="lg" className="h-full">
          <div class="flex items-center mb-6">
            <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            <h3 class="text-lg font-semibold text-white ml-3">Profile Status</h3>
          </div>
         <div class="space-y-4">
           <div class="flex justify-between items-center py-2">
             <span class="text-gray-400 text-sm">Name</span>
             <span class="text-white font-medium">{user?.name || 'Not set'}</span>
           </div>
           <div class="flex justify-between items-center py-2">
             <span class="text-gray-400 text-sm">Email</span>
             <span class="text-white font-medium">{user?.email}</span>
           </div>
           <div class="flex justify-between items-center py-2">
             <span class="text-gray-400 text-sm">Role</span>
             <span class="text-orange-400 font-medium capitalize">{user?.role || 'user'}</span>
           </div>
         </div>
       </Card>

               <!-- Email Verification -->
        <Card variant="elevated" padding="lg" className="h-full">
          <div class="flex items-center mb-6">
            <svg class="w-6 h-6 {user?.emailVerified ? 'text-green-400' : 'text-yellow-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 class="text-lg font-semibold text-white ml-3">Email Verification</h3>
          </div>
         <div class="space-y-4">
           <div class="flex justify-between items-center py-2">
             <span class="text-gray-400 text-sm">Status</span>
             <span class="font-medium {user?.emailVerified ? 'text-green-400' : 'text-yellow-400'}">
               {user?.emailVerified ? 'Verified' : 'Pending'}
             </span>
           </div>
           {#if !user?.emailVerified}
             <div class="pt-2">
               <Button variant="outline" size="sm" fullWidth on:click={() => goto('/verify-email')}>
                 Verify Now
               </Button>
             </div>
           {/if}
         </div>
       </Card>

               <!-- Security Status -->
        <Card variant="elevated" padding="lg" className="h-full">
          <div class="flex items-center mb-6">
            <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
            <h3 class="text-lg font-semibold text-white ml-3">Security</h3>
          </div>
         <div class="space-y-4">
           <div class="flex justify-between items-center py-2">
             <span class="text-gray-400 text-sm">Last Login</span>
             <span class="text-white font-medium">{user?.lastSignIn || 'Recently'}</span>
           </div>
           <div class="flex justify-between items-center py-2">
             <span class="text-gray-400 text-sm">Auth Method</span>
             <span class="text-white font-medium">Email/Password</span>
           </div>
         </div>
       </Card>
     </div>

    <!-- Profile Management Section -->
    <Card variant="elevated" padding="lg" className="mb-8">
      <h2 class="text-2xl font-bold text-white mb-6">Profile Management</h2>
      
      <!-- Name Editing -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-white mb-1">Display Name</h3>
            <p class="text-gray-400 text-sm">Update your display name that appears throughout the application</p>
          </div>
          {#if !editingName}
            <Button variant="outline" size="sm" on:click={() => editingName = true}>
              Edit Name
            </Button>
          {/if}
        </div>

        {#if editingName}
          <div class="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="New Name"
                bind:value={newName}
                placeholder="Enter your new name"
                required
              />
              <div class="flex items-end space-x-3">
                <Button 
                  variant="primary" 
                  size="sm" 
                  disabled={isSaving || !newName.trim() || newName === user.name}
                  on:click={handleSaveName}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={isSaving}
                  on:click={() => {
                    editingName = false;
                    newName = user.name;
                    saveMessage = '';
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
            
          </div>
        {/if}
      </div>

      <!-- Password Management -->
      <div class="mt-8 pt-8 border-t border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-white mb-1">Password Management</h3>
            <p class="text-gray-400 text-sm">Change your account password to keep it secure</p>
          </div>
          {#if !showPasswordForm}
            <Button variant="outline" size="sm" on:click={() => showPasswordForm = true}>
              Change Password
            </Button>
          {/if}
        </div>

        {#if showPasswordForm}
          <div class="mt-4 bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="password"
                label="Current Password"
                bind:value={currentPassword}
                placeholder="Enter current password"
                required
              />
              <Input
                type="password"
                label="New Password"
                bind:value={newPassword}
                placeholder="Enter new password"
                required
              />
              <Input
                type="password"
                label="Confirm New Password"
                bind:value={confirmPassword}
                placeholder="Confirm new password"
                required
              />
              <div class="flex items-end space-x-3">
                <Button 
                  variant="primary" 
                  size="sm" 
                  disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                  on:click={handleChangePassword}
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={isChangingPassword}
                  on:click={() => {
                    showPasswordForm = false;
                    currentPassword = '';
                    newPassword = '';
                    confirmPassword = '';
                    passwordError = '';
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
            {#if passwordError}
              <p class="mt-3 text-sm text-red-400">
                {passwordError}
              </p>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Account Deletion -->
      {#if !isAdmin}
        <div class="mt-8 pt-8 border-t border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-white mb-1">Delete Account</h3>
              <p class="text-gray-400 text-sm">Permanently delete your account and all associated data</p>
            </div>
            {#if !showDeleteAccountForm}
              <Button variant="danger" size="sm" on:click={() => showDeleteAccountForm = true}>
                Delete Account
              </Button>
            {/if}
          </div>

        {#if showDeleteAccountForm}
          <div class="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-6">
            <!-- Warning Section -->
            <div class="mb-6">
              <div class="flex items-start space-x-3">
                <svg class="w-6 h-6 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
                <div>
                  <h4 class="text-lg font-semibold text-red-400 mb-2">⚠️ Warning: This action is irreversible</h4>
                  <div class="text-sm text-gray-300 space-y-1">
                    <p>• All your data will be permanently deleted</p>
                    <p>• All chat conversations and messages will be lost</p>
                    <p>• Your account cannot be recovered</p>
                    <p>• You will be immediately logged out</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Password Verification -->
            <div class="space-y-4">
              <Input
                type="password"
                label="Enter your password to confirm"
                bind:value={deleteAccountPassword}
                placeholder="Enter your current password"
                required
              />
              
              <div class="flex items-center space-x-3">
                <Button 
                  variant="danger" 
                  size="sm" 
                  disabled={isDeletingAccount || !deleteAccountPassword}
                  on:click={handleDeleteAccount}
                >
                  {isDeletingAccount ? 'Deleting...' : 'Permanently Delete Account'}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={isDeletingAccount}
                  on:click={() => {
                    showDeleteAccountForm = false;
                    deleteAccountPassword = '';
                    deleteAccountError = '';
                  }}
                >
                  Cancel
                </Button>
              </div>
              
              {#if deleteAccountError}
                <p class="text-sm text-red-400">
                  {deleteAccountError}
                </p>
              {/if}
            </div>
          </div>
        {/if}
        </div>
      {/if}
    </Card>

    <!-- Quick Actions -->
    <Card variant="elevated" padding="lg" className="mb-8">
      <h2 class="text-2xl font-bold text-white mb-6">Quick Actions</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Button variant="outline" fullWidth on:click={() => goto('/chat')}>
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
          </svg>
          Start Chat
        </Button>
        
        {#if isAdmin}
          <Button variant="outline" fullWidth on:click={() => goto('/admin')}>
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            Admin Panel
          </Button>
        {/if}
        
        <Button variant="outline" fullWidth on:click={() => goto('/reset-password')}>
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
          </svg>
          Reset Password
        </Button>
      </div>
    </Card>

    <!-- Notifications -->
    <Card variant="elevated" padding="lg">
      <h2 class="text-2xl font-bold text-white mb-6">Notifications</h2>
      <div class="space-y-4">
        {#if !user?.emailVerified}
          <div class="flex items-center p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <svg class="w-6 h-6 text-yellow-400 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <div class="flex-1">
              <p class="text-white font-medium">Email verification pending</p>
              <p class="text-gray-400 text-sm">Please verify your email address to access all features</p>
            </div>
            <Button variant="outline" size="sm" on:click={() => goto('/verify-email')}>
              Verify Now
            </Button>
          </div>
        {/if}
        
        <div class="flex items-center p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <svg class="w-6 h-6 text-blue-400 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div class="flex-1">
            <p class="text-white font-medium">Account security</p>
            <p class="text-gray-400 text-sm">Your account is secure and up to date</p>
          </div>
        </div>
      </div>
    </Card>
  </main>
  
  <!-- Notification Component -->
  <Notification 
    bind:show={notification.show}
    type={notification.type}
    message={notification.message}
    on:close={() => notification.show = false}
  />
</div>

<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';

  export let title = 'ChatBot';
  export let subtitle = 'Ask me anything - I\'m here to help!';

  const dispatch = createEventDispatcher();

  // Eye tracking state
  let mouseX = 0;
  let mouseY = 0;
  let botElement: HTMLElement;
  let isHovering = false;

  // Eye positions relative to bot center
  $: leftEyeX = isHovering ? Math.max(-3, Math.min(3, (mouseX - 50) * 0.1)) : 0;
  $: leftEyeY = isHovering ? Math.max(-2, Math.min(2, (mouseY - 50) * 0.08)) : 0;
  $: rightEyeX = isHovering ? Math.max(-3, Math.min(3, (mouseX - 50) * 0.1)) : 0;
  $: rightEyeY = isHovering ? Math.max(-2, Math.min(2, (mouseY - 50) * 0.08)) : 0;

  function toggleSidebar() {
    dispatch('toggleSidebar');
  }

  function handleMouseMove(event: MouseEvent) {
    if (!botElement || !isHovering) return;

    const rect = botElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    mouseX = ((event.clientX - centerX) / rect.width) * 100;
    mouseY = ((event.clientY - centerY) / rect.height) * 100;
  }

  onMount(() => {
    // Only add event listener on client side
    if (typeof window !== 'undefined') {
      document.addEventListener('mousemove', handleMouseMove);
    }
  });

  onDestroy(() => {
    // Only remove event listener on client side
    if (typeof window !== 'undefined') {
      document.removeEventListener('mousemove', handleMouseMove);
    }
  });
</script>

<header class="bg-gray-900/95 backdrop-blur-md shadow-lg shadow-orange-500/10 border-b border-orange-500/20 animate-fadeInDown">
  <div class="px-6 py-4">
    <div class="flex items-center justify-between">
      <!-- Left Section: AI Info -->
      <div class="flex items-center space-x-4">
        <!-- AI Avatar -->
        <div
          bind:this={botElement}
          class="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300 group relative overflow-hidden cursor-pointer"
          on:mouseenter={() => isHovering = true}
          on:mouseleave={() => isHovering = false}
          role="img"
          aria-label="Interactive AI assistant avatar with eye tracking"
        >
          <!-- Animated background with multiple layers -->
          <div class="absolute inset-0 bg-gradient-to-br from-cyan-400/30 via-blue-500/20 to-purple-600/30 rounded-2xl animate-pulse"></div>
          <div class="absolute inset-0 bg-gradient-to-tl from-orange-400/20 to-pink-500/20 rounded-2xl animate-pulse" style="animation-delay: 1s;"></div>

          <!-- Enhanced Bot Icon with Eye Tracking -->
          <svg class="w-7 h-7 text-orange-400 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <!-- Bot Head with gradient fill -->
            <rect x="4" y="6" width="16" height="12" rx="3" stroke-width="2" fill="url(#botHeadGradient)" class="animate-pulse"/>

            <!-- Eye sockets -->
            <ellipse cx="9" cy="10" rx="2.5" ry="2" fill="rgba(255,255,255,0.1)" stroke="currentColor" stroke-width="0.5"/>
            <ellipse cx="15" cy="10" rx="2.5" ry="2" fill="rgba(255,255,255,0.1)" stroke="currentColor" stroke-width="0.5"/>

            <!-- Movable Eyes with tracking -->
            <circle cx={9 + leftEyeX} cy={10 + leftEyeY} r="1.8" fill="currentColor" class="transition-transform duration-100 ease-out">
              <animate attributeName="r" values="1.8;2.2;1.8" dur="3s" repeatCount="indefinite"/>
            </circle>
            <circle cx={15 + rightEyeX} cy={10 + rightEyeY} r="1.8" fill="currentColor" class="transition-transform duration-100 ease-out">
              <animate attributeName="r" values="1.8;2.2;1.8" dur="3s" repeatCount="indefinite" begin="0.5s"/>
            </circle>

            <!-- Eye highlights -->
            <circle cx={9.5 + leftEyeX} cy={9.5 + leftEyeY} r="0.4" fill="white" opacity="0.8"/>
            <circle cx={15.5 + rightEyeX} cy={9.5 + rightEyeY} r="0.4" fill="white" opacity="0.8"/>

            <!-- Animated Mouth -->
            <path d="M8.5 14 Q12 15.5 15.5 14" stroke-width="2" stroke-linecap="round" fill="none" class="animate-pulse">
              <animate attributeName="d" values="M8.5 14 Q12 15.5 15.5 14;M8.5 14 Q12 16 15.5 14;M8.5 14 Q12 15.5 15.5 14" dur="2s" repeatCount="indefinite"/>
            </path>

            <!-- Enhanced Antennas -->
            <line x1="8" y1="6" x2="7" y2="3.5" stroke-width="2" class="animate-bounce" style="animation-delay: 0.5s; animation-duration: 2s;"/>
            <line x1="16" y1="6" x2="17" y2="3.5" stroke-width="2" class="animate-bounce" style="animation-delay: 0.7s; animation-duration: 2s;"/>

            <!-- Antenna tips with enhanced glow -->
            <circle cx="7" cy="3.5" r="1.2" fill="currentColor" class="animate-ping" style="animation-delay: 0.5s;"/>
            <circle cx="17" cy="3.5" r="1.2" fill="currentColor" class="animate-ping" style="animation-delay: 0.7s;"/>
            <circle cx="7" cy="3.5" r="0.6" fill="white" opacity="0.9" class="animate-pulse"/>
            <circle cx="17" cy="3.5" r="0.6" fill="white" opacity="0.9" class="animate-pulse" style="animation-delay: 0.5s;"/>

            <!-- Body details -->
            <rect x="6" y="8" width="12" height="8" rx="1.5" stroke-width="1.5" fill="none" class="animate-pulse" opacity="0.7"/>
            <line x1="9" y1="10" x2="9" y2="14" stroke-width="1" opacity="0.5" class="animate-pulse"/>
            <line x1="15" y1="10" x2="15" y2="14" stroke-width="1" opacity="0.5" class="animate-pulse" style="animation-delay: 0.3s;"/>
          </svg>

          <!-- Enhanced circuit pattern overlay -->
          <div class="absolute inset-0 opacity-40">
            <svg class="w-full h-full" viewBox="0 0 48 48">
              <defs>
                <pattern id="circuit" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="0.8" fill="currentColor" opacity="0.4" class="animate-pulse"/>
                  <circle cx="6" cy="6" r="0.8" fill="currentColor" opacity="0.4" class="animate-pulse" style="animation-delay: 0.5s;"/>
                  <line x1="2" y1="2" x2="6" y2="6" stroke="currentColor" stroke-width="0.4" opacity="0.3"/>
                  <line x1="6" y1="2" x2="2" y2="6" stroke="currentColor" stroke-width="0.3" opacity="0.2"/>
                </pattern>
                <radialGradient id="botHeadGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="rgba(249,115,22,0.8)"/>
                  <stop offset="100%" stop-color="rgba(249,115,22,0.4)"/>
                </radialGradient>
              </defs>
              <rect width="48" height="48" fill="url(#circuit)" class="text-orange-300"/>
            </svg>
          </div>

          <!-- Hover glow effect -->
          <div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-400/20 to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
        </div>
        
        <!-- Chat Info -->
        <div class="flex-1 min-w-0">
          <h1 class="text-2xl font-bold text-white truncate">{title}</h1>
          <p class="text-sm text-gray-400 truncate">{subtitle}</p>
        </div>
      </div>
      
      <!-- Right Section: Actions -->
      <div class="flex items-center space-x-3">
        <!-- Status Indicator -->
        <span class="text-xs font-medium text-green-400">Online</span>
        
        <!-- Mobile Sidebar Toggle -->
        <button
          on:click={toggleSidebar}
          class="md:hidden relative p-3 text-gray-400 hover:text-white rounded-xl transition-all duration-300 focus:outline-none group
                 bg-gray-800/50 hover:bg-gray-700/60
                 border border-gray-600/30 hover:border-gray-500/50
                 shadow-[0_4px_12px_rgba(0,0,0,0.4),0_2px_4px_rgba(0,0,0,0.2)]
                 hover:shadow-[0_6px_20px_rgba(0,0,0,0.6),0_4px_8px_rgba(0,0,0,0.3)]
                 active:shadow-[0_2px_8px_rgba(0,0,0,0.5),0_1px_2px_rgba(0,0,0,0.2)]
                 hover:transform hover:scale-105 hover:-translate-y-0.5
                 active:transform active:scale-95 active:translate-y-0
                 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-gray-600/20 before:to-gray-700/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
          aria-label="Toggle conversation sidebar"
          aria-expanded="false"
          aria-controls="chat-sidebar"
        >
          <svg class="w-6 h-6 relative z-10 transition-transform group-hover:scale-110 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
</header>

<style>
  /* Header entrance animation */
  .animate-fadeInDown {
    animation: fadeInDown 0.8s ease-out;
  }

  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-15px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* Bot avatar enhanced floating animation with rotation */
  .w-12.h-12 {
    animation: gentleFloatRotate 6s ease-in-out infinite;
  }

  @keyframes gentleFloatRotate {
    0%, 100% {
      transform: translateY(0px) rotate(0deg);
    }
    25% {
      transform: translateY(-4px) rotate(1deg);
    }
    50% {
      transform: translateY(-2px) rotate(0deg);
    }
    75% {
      transform: translateY(-6px) rotate(-1deg);
    }
  }

  /* Enhanced bot hover effects with multiple glow layers */
  .group:hover .text-orange-400 {
    filter: drop-shadow(0 0 12px rgba(249, 115, 22, 0.8))
            drop-shadow(0 0 24px rgba(6, 182, 212, 0.4));
  }

  /* Multi-layered circuit pattern animation */
  .animate-pulse {
    animation: circuitPulse 4s ease-in-out infinite;
  }

  @keyframes circuitPulse {
    0%, 100% {
      opacity: 0.2;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.05);
    }
  }

  /* Enhanced antenna tips with rainbow glow */
  .animate-ping {
    animation: antennaGlowRainbow 3s ease-in-out infinite;
  }

  @keyframes antennaGlowRainbow {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
      filter: drop-shadow(0 0 4px rgba(249, 115, 22, 0.6));
    }
    25% {
      opacity: 0.8;
      transform: scale(1.3);
      filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.8));
    }
    50% {
      opacity: 0.6;
      transform: scale(1.1);
      filter: drop-shadow(0 0 6px rgba(168, 85, 247, 0.7));
    }
    75% {
      opacity: 0.8;
      transform: scale(1.4);
      filter: drop-shadow(0 0 10px rgba(249, 115, 22, 0.9));
    }
  }

  /* Eye tracking smooth movement */
  .transition-transform {
    transition: cx 0.1s ease-out, cy 0.1s ease-out;
  }

  /* Bot head breathing effect */
  rect[fill="url(#botHeadGradient)"] {
    animation: botBreathing 4s ease-in-out infinite;
  }

  @keyframes botBreathing {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.02);
    }
  }

  /* Enhanced background gradient animation */
  .bg-gradient-to-br {
    animation: gradientShift 8s ease-in-out infinite;
  }

  @keyframes gradientShift {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }

  /* Mouth expression changes */
  path[d*="Q12"] {
    animation: mouthExpression 5s ease-in-out infinite;
  }

  @keyframes mouthExpression {
    0%, 100% {
      d: path("M8.5 14 Q12 15.5 15.5 14");
    }
    25% {
      d: path("M8.5 14 Q12 16 15.5 14");
    }
    50% {
      d: path("M8.5 14 Q12 15 15.5 14");
    }
    75% {
      d: path("M8.5 14 Q12 16.5 15.5 14");
    }
  }

  /* Hover state enhancements */
  .group:hover {
    filter: brightness(1.1) saturate(1.2);
  }

  /* Eye blink animation */
  circle[r="1.8"] {
    animation: eyeBlink 8s ease-in-out infinite;
  }

  @keyframes eyeBlink {
    0%, 97%, 100% {
      r: 1.8;
    }
    98% {
      r: 0.2;
    }
  }

  /* Circuit pattern enhanced animation */
  pattern#circuit circle {
    animation: circuitNode 2s ease-in-out infinite;
  }

  @keyframes circuitNode {
    0%, 100% {
      fill-opacity: 0.4;
      r: 0.8;
    }
    50% {
      fill-opacity: 0.8;
      r: 1.2;
    }
  }
</style>

<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import { onMount } from 'svelte';

  /** @type {import('$lib/types').User | null} */
  export let user: any = null;

  // Counter animation function
  function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    counters.forEach(counter => {
      const target = counter.getAttribute('data-target');
      if (!target) return;

      // Handle special cases
      if (target === '∞') {
        counter.textContent = '∞';
        return;
      }

      if (target === '24/7') {
        counter.textContent = '24/7';
        return;
      }

      if (target === '100%') {
        counter.textContent = '100%';
        return;
      }

      // Handle numeric values
      const numericMatch = target.match(/(\d+)/);
      if (numericMatch) {
        const targetValue = parseInt(numericMatch[1]);
        let currentValue = 0;
        const increment = Math.ceil(targetValue / 50); // Adjust speed here
        const duration = 2000; // 2 seconds
        const stepTime = duration / (targetValue / increment);

        const timer = setInterval(() => {
          currentValue += increment;
          if (currentValue >= targetValue) {
            counter.textContent = target;
            clearInterval(timer);
          } else {
            counter.textContent = currentValue.toString();
          }
        }, stepTime);
      }
    });
  }

  // Intersection Observer for triggering animations
  function setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Trigger counter animation when cards come into view
          setTimeout(() => {
            animateCounters();
          }, 800); // Delay to sync with entrance animation
        }
      });
    }, { threshold: 0.3 });

    // Observe the cards container
    const cardsContainer = document.querySelector('[class*="grid-cols"]');
    if (cardsContainer) {
      observer.observe(cardsContainer);
    }
  }

  onMount(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      // Trigger counter animation after a delay
      setTimeout(() => {
        animateCounters();
      }, 2000); // Wait for entrance animations to complete

      // Setup intersection observer for scroll-triggered animations
      setupIntersectionObserver();
    }
  });
</script>

<section class="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center px-6 py-16 relative overflow-hidden">
  <!-- Background Pattern -->
  <div class="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-850 to-gray-900"></div>
  <div class="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_30px_30px,rgba(255,255,255,0.1)_2px,transparent_2px)] bg-[length:60px_60px]"></div>
  
  <div class="relative z-10 text-center max-w-4xl mx-auto">
    <h1 class="text-4xl md:text-6xl font-bold text-center mb-6 text-gradient">
      Authenra - Authentication Made Simple
    </h1>
    <p class="text-lg md:text-xl text-center mb-8 max-w-3xl mx-auto text-gray-300 leading-relaxed">
      Modern authentication system with role-based access, email verification, and OAuth integration. Built with SvelteKit and Tailwind CSS.
    </p>
    
    <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
      {#if user}
        <a href="/dashboard" class="btn-primary text-base px-6 py-3 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-orange-500 transform hover:scale-105">
          Dashboard
        </a>
        <a href="/chat" class="btn-secondary text-base px-6 py-3 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500 transform hover:scale-105">
          AI Chat
        </a>
      {:else}
        <a href="/login" class="btn-primary text-base px-6 py-3 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-orange-500 transform hover:scale-105">
          Get Started
        </a>
        <Button variant="secondary" size="lg">
          View Documentation
        </Button>
      {/if}
    </div>

    <!-- Crystal Geometric Feature Badges -->
    <div class="flex flex-wrap justify-center gap-4 mb-8">
      <!-- Authenra Badge -->
      <div class="crystal-badge badge-animated badge-1 group relative cursor-pointer">
        <div class="crystal-inner">
          <!-- Geometric Background -->
          <div class="crystal-geometry">
            <div class="crystal-face face-front"></div>
            <div class="crystal-face face-right"></div>
            <div class="crystal-face face-top"></div>
            <div class="crystal-face face-left"></div>
            <div class="crystal-face face-bottom"></div>
          </div>
          
          <!-- Content Layer -->
          <div class="crystal-content">
            <div class="crystal-icon text-green-400">🔐</div>
            <span class="crystal-text text-green-400">Authenra</span>
          </div>
          
          <!-- Crystal Edges -->
          <div class="crystal-edges">
            <div class="edge edge-1"></div>
            <div class="edge edge-2"></div>
            <div class="edge edge-3"></div>
            <div class="edge edge-4"></div>
            <div class="edge edge-5"></div>
            <div class="edge edge-6"></div>
            <div class="edge edge-7"></div>
            <div class="edge edge-8"></div>
          </div>
          
          <!-- Geometric Patterns -->
          <div class="crystal-patterns">
            <div class="pattern-line pattern-1"></div>
            <div class="pattern-line pattern-2"></div>
            <div class="pattern-line pattern-3"></div>
          </div>
          
          <!-- Hover Effects -->
          <div class="crystal-hover-effect"></div>
        </div>
      </div>

      <!-- Email Verification Badge -->
      <div class="crystal-badge badge-animated badge-2 group relative cursor-pointer">
        <div class="crystal-inner">
          <!-- Geometric Background -->
          <div class="crystal-geometry">
            <div class="crystal-face face-front"></div>
            <div class="crystal-face face-right"></div>
            <div class="crystal-face face-top"></div>
            <div class="crystal-face face-left"></div>
            <div class="crystal-face face-bottom"></div>
          </div>
          
          <!-- Content Layer -->
          <div class="crystal-content">
            <div class="crystal-icon text-blue-400">📧</div>
            <span class="crystal-text text-blue-400">Email Verification</span>
          </div>
          
          <!-- Crystal Edges -->
          <div class="crystal-edges">
            <div class="edge edge-1"></div>
            <div class="edge edge-2"></div>
            <div class="edge edge-3"></div>
            <div class="edge edge-4"></div>
            <div class="edge edge-5"></div>
            <div class="edge edge-6"></div>
            <div class="edge edge-7"></div>
            <div class="edge edge-8"></div>
          </div>
          
          <!-- Geometric Patterns -->
          <div class="crystal-patterns">
            <div class="pattern-line pattern-1"></div>
            <div class="pattern-line pattern-2"></div>
            <div class="pattern-line pattern-3"></div>
          </div>
          
          <!-- Hover Effects -->
          <div class="crystal-hover-effect"></div>
        </div>
      </div>

      <!-- Role-Based Access Badge -->
      <div class="crystal-badge badge-animated badge-3 group relative cursor-pointer">
        <div class="crystal-inner">
          <!-- Geometric Background -->
          <div class="crystal-geometry">
            <div class="crystal-face face-front"></div>
            <div class="crystal-face face-right"></div>
            <div class="crystal-face face-top"></div>
            <div class="crystal-face face-left"></div>
            <div class="crystal-face face-bottom"></div>
          </div>
          
          <!-- Content Layer -->
          <div class="crystal-content">
            <div class="crystal-icon text-purple-400">👥</div>
            <span class="crystal-text text-purple-400">Role-Based Access</span>
          </div>
          
          <!-- Crystal Edges -->
          <div class="crystal-edges">
            <div class="edge edge-1"></div>
            <div class="edge edge-2"></div>
            <div class="edge edge-3"></div>
            <div class="edge edge-4"></div>
            <div class="edge edge-5"></div>
            <div class="edge edge-6"></div>
            <div class="edge edge-7"></div>
            <div class="edge edge-8"></div>
          </div>
          
          <!-- Geometric Patterns -->
          <div class="crystal-patterns">
            <div class="pattern-line pattern-1"></div>
            <div class="pattern-line pattern-2"></div>
            <div class="pattern-line pattern-3"></div>
          </div>
          
          <!-- Hover Effects -->
          <div class="crystal-hover-effect"></div>
        </div>
      </div>

      <!-- OAuth Integration Badge -->
      <div class="crystal-badge badge-animated badge-4 group relative cursor-pointer">
        <div class="crystal-inner">
          <!-- Geometric Background -->
          <div class="crystal-geometry">
            <div class="crystal-face face-front"></div>
            <div class="crystal-face face-right"></div>
            <div class="crystal-face face-top"></div>
            <div class="crystal-face face-left"></div>
            <div class="crystal-face face-bottom"></div>
          </div>
          
          <!-- Content Layer -->
          <div class="crystal-content">
            <div class="crystal-icon text-orange-400">🔗</div>
            <span class="crystal-text text-orange-400">OAuth Integration</span>
          </div>
          
          <!-- Crystal Edges -->
          <div class="crystal-edges">
            <div class="edge edge-1"></div>
            <div class="edge edge-2"></div>
            <div class="edge edge-3"></div>
            <div class="edge edge-4"></div>
            <div class="edge edge-5"></div>
            <div class="edge edge-6"></div>
            <div class="edge edge-7"></div>
            <div class="edge edge-8"></div>
          </div>
          
          <!-- Geometric Patterns -->
          <div class="crystal-patterns">
            <div class="pattern-line pattern-1"></div>
            <div class="pattern-line pattern-2"></div>
            <div class="pattern-line pattern-3"></div>
          </div>
          
          <!-- Hover Effects -->
          <div class="crystal-hover-effect"></div>
        </div>
      </div>
    </div>

    <!-- Elegant Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
      <!-- Secure Card -->
      <div class="elegant-card card-entrance-1 group relative">
        <div class="card-content">
          <!-- Icon with morphing background -->
          <div class="icon-container bg-gradient-to-br from-green-400 to-emerald-500">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>

          <!-- Statistic with counter animation -->
          <div class="stat-number" data-target="100%">0%</div>
          <div class="stat-label">Secure</div>
          
          <!-- Decorative elements -->
          <div class="card-decoration decoration-1"></div>
          <div class="card-decoration decoration-2"></div>
        </div>

        <!-- Ripple effect on hover -->
        <div class="card-ripple"></div>
      </div>

      <!-- Available Card -->
      <div class="elegant-card card-entrance-2 group relative">
        <div class="card-content">
          <!-- Icon with morphing background -->
          <div class="icon-container bg-gradient-to-br from-blue-400 to-cyan-500">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>

          <!-- Statistic with counter animation -->
          <div class="stat-number" data-target="24/7">0</div>
          <div class="stat-label">Available</div>

          <!-- Decorative elements -->
          <div class="card-decoration decoration-1"></div>
          <div class="card-decoration decoration-2"></div>
        </div>

        <!-- Ripple effect on hover -->
        <div class="card-ripple"></div>
      </div>

      <!-- Scalable Card -->
      <div class="elegant-card card-entrance-3 group relative">
        <div class="card-content">
          <!-- Icon with morphing background -->
          <div class="icon-container bg-gradient-to-br from-purple-400 to-pink-500">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>

          <!-- Statistic with counter animation -->
          <div class="stat-number" data-target="∞">0</div>
          <div class="stat-label">Scalable</div>

          <!-- Decorative elements -->
          <div class="card-decoration decoration-1"></div>
          <div class="card-decoration decoration-2"></div>
        </div>

        <!-- Ripple effect on hover -->
        <div class="card-ripple"></div> 
      </div>
    </div>
  </div>
</section>

<style>
  /* Crystal Geometric Badge Structure */
  .crystal-badge {
    animation: crystalEntrance 0.8s ease-out forwards;
    opacity: 0;
    transform: translateY(20px) scale(0.7) rotate(45deg);
    position: relative;
    width: auto;
    height: auto;
  }

  .badge-1 { animation-delay: 0.1s; }
  .badge-2 { animation-delay: 0.2s; }
  .badge-3 { animation-delay: 0.3s; }
  .badge-4 { animation-delay: 0.4s; }

  @keyframes crystalEntrance {
    0% {
      opacity: 0;
      transform: translateY(20px) scale(0.7) rotate(45deg);
    }
    50% {
      opacity: 0.8;
      transform: translateY(5px) scale(1.1) rotate(22deg);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1) rotate(0deg);
    }
  }

  /* Crystal Inner Container */
  .crystal-inner {
    position: relative;
    padding: 14px 22px;
    background: linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%);
    border: 2px solid rgba(75, 85, 99, 0.4);
    clip-path: polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.4),
      0 4px 16px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    overflow: hidden;
  }

  /* Geometric Background Faces */
  .crystal-geometry {
    position: absolute;
    inset: 0;
    transform-style: preserve-3d;
  }

  .crystal-face {
    position: absolute;
    background: linear-gradient(45deg, rgba(75, 85, 99, 0.1), rgba(107, 114, 128, 0.1));
    border: 1px solid rgba(75, 85, 99, 0.2);
  }

  .face-front {
    inset: 2px;
    background: linear-gradient(135deg, rgba(17, 24, 39, 0.9), rgba(31, 41, 55, 0.9));
  }

  .face-right {
    right: 0;
    top: 15%;
    bottom: 15%;
    width: 8px;
    transform: rotateY(90deg) translateZ(4px);
    background: linear-gradient(180deg, rgba(75, 85, 99, 0.3), rgba(107, 114, 128, 0.3));
  }

  .face-left {
    left: 0;
    top: 15%;
    bottom: 15%;
    width: 8px;
    transform: rotateY(-90deg) translateZ(4px);
    background: linear-gradient(180deg, rgba(75, 85, 99, 0.3), rgba(107, 114, 128, 0.3));
  }

  .face-top {
    top: 0;
    left: 15%;
    right: 15%;
    height: 8px;
    transform: rotateX(90deg) translateZ(4px);
    background: linear-gradient(90deg, rgba(75, 85, 99, 0.3), rgba(107, 114, 128, 0.3));
  }

  .face-bottom {
    bottom: 0;
    left: 15%;
    right: 15%;
    height: 8px;
    transform: rotateX(-90deg) translateZ(4px);
    background: linear-gradient(90deg, rgba(75, 85, 99, 0.3), rgba(107, 114, 128, 0.3));
  }

  /* Content Layer */
  .crystal-content {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 10px;
    transform: translateZ(2px);
  }

  /* Crystal Icon */
  .crystal-icon {
    font-size: 1.2rem;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
    transition: all 0.3s ease;
  }

  /* Crystal Text */
  .crystal-text {
    font-size: 0.875rem;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
    transition: all 0.3s ease;
    white-space: nowrap;
  }

  /* Crystal Edges */
  .crystal-edges {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .edge {
    position: absolute;
    background: linear-gradient(45deg, rgba(255, 255, 255, 0.1), transparent);
    opacity: 0;
    transition: all 0.3s ease;
  }

  .edge-1 {
    top: 0;
    left: 15%;
    right: 15%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  }

  .edge-2 {
    top: 15%;
    right: 0;
    bottom: 15%;
    width: 1px;
    background: linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  }

  .edge-3 {
    bottom: 0;
    left: 15%;
    right: 15%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  }

  .edge-4 {
    top: 15%;
    left: 0;
    bottom: 15%;
    width: 1px;
    background: linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  }

  .edge-5 {
    top: 25%;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  }

  .edge-6 {
    top: 0;
    left: 25%;
    right: 25%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  }

  .edge-7 {
    bottom: 25%;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  }

  .edge-8 {
    bottom: 0;
    left: 25%;
    right: 25%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  }

  /* Geometric Patterns */
  .crystal-patterns {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .pattern-line {
    position: absolute;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    opacity: 0;
    transition: all 0.4s ease;
  }

  .pattern-1 {
    top: 20%;
    left: 0;
    right: 0;
    height: 1px;
    transform: rotate(45deg);
  }

  .pattern-2 {
    top: 60%;
    left: 0;
    right: 0;
    height: 1px;
    transform: rotate(-45deg);
  }

  .pattern-3 {
    top: 40%;
    left: 0;
    right: 0;
    height: 1px;
    transform: rotate(90deg);
  }

  /* Hover Effect */
  .crystal-hover-effect {
    position: absolute;
    inset: -2px;
    background: conic-gradient(from 0deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    opacity: 0;
    transition: opacity 0.4s ease;
    border-radius: inherit;
    z-index: 1;
  }

  /* Crystal Hover Effects */
  .crystal-badge:hover .crystal-inner {
    transform: translateY(-6px) scale(1.05);
    box-shadow: 
      0 20px 60px rgba(0, 0, 0, 0.5),
      0 10px 30px rgba(0, 0, 0, 0.4),
      inset 0 2px 0 rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
  }

  .crystal-badge:hover .crystal-hover-effect {
    opacity: 1;
    animation: crystalRotate 3s linear infinite;
  }

  .crystal-badge:hover .edge {
    opacity: 1;
    background: linear-gradient(45deg, rgba(255, 255, 255, 0.4), transparent);
  }

  .crystal-badge:hover .pattern-line {
    opacity: 1;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  }

  .crystal-badge:hover .crystal-icon {
    transform: scale(1.2) rotate(5deg);
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.7));
  }

  .crystal-badge:hover .crystal-text {
    transform: scale(1.05);
    text-shadow: 
      0 2px 4px rgba(0, 0, 0, 0.8),
      0 0 12px currentColor;
  }

  /* Active State */
  .crystal-badge:active .crystal-inner {
    transform: translateY(-2px) scale(0.98);
    transition: all 0.1s ease;
  }

  /* Continuous Subtle Animation */
  .crystal-badge {
    animation: crystalEntrance 0.8s ease-out forwards, crystalFloat 8s ease-in-out infinite;
  }

  @keyframes crystalFloat {
    0%, 100% {
      transform: translateY(0) rotate(0deg);
    }
    25% {
      transform: translateY(-2px) rotate(1deg);
    }
    50% {
      transform: translateY(1px) rotate(-0.5deg);
    }
    75% {
      transform: translateY(-1px) rotate(0.5deg);
    }
  }

  @keyframes crystalRotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Color-Specific Hover Effects */
  .crystal-badge:nth-child(1):hover .crystal-inner {
    border-color: rgba(34, 197, 94, 0.6);
    box-shadow: 
      0 20px 60px rgba(34, 197, 94, 0.2),
      0 10px 30px rgba(0, 0, 0, 0.4);
  }

  .crystal-badge:nth-child(2):hover .crystal-inner {
    border-color: rgba(59, 130, 246, 0.6);
    box-shadow: 
      0 20px 60px rgba(59, 130, 246, 0.2),
      0 10px 30px rgba(0, 0, 0, 0.4);
  }

  .crystal-badge:nth-child(3):hover .crystal-inner {
    border-color: rgba(139, 92, 246, 0.6);
    box-shadow: 
      0 20px 60px rgba(139, 92, 246, 0.2),
      0 10px 30px rgba(0, 0, 0, 0.4);
  }

  .crystal-badge:nth-child(4):hover .crystal-inner {
    border-color: rgba(249, 115, 22, 0.6);
    box-shadow: 
      0 20px 60px rgba(249, 115, 22, 0.2),
      0 10px 30px rgba(0, 0, 0, 0.4);
  }

  /* Elegant Card Styles */
  .elegant-card {
    background: linear-gradient(135deg, rgba(31, 41, 55, 0.9) 0%, rgba(17, 24, 39, 0.9) 100%);
    border: 1px solid rgba(75, 85, 99, 0.3);
    border-radius: 20px;
    padding: 2rem;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(10px);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
  }

  .elegant-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.5s;
  }

  .elegant-card:hover::before {
    left: 100%;
  }

  /* Card Entrance Animations */
  .card-entrance-1 {
    animation: elegantEntrance 0.8s ease-out forwards;
    animation-delay: 0.6s;
    opacity: 0;
    transform: translateY(40px) rotateX(-10deg);
  }

  .card-entrance-2 {
    animation: elegantEntrance 0.8s ease-out forwards;
    animation-delay: 0.8s;
    opacity: 0;
    transform: translateY(40px) rotateX(-10deg);
  }

  .card-entrance-3 {
    animation: elegantEntrance 0.8s ease-out forwards;
    animation-delay: 1.0s;
    opacity: 0;
    transform: translateY(40px) rotateX(-10deg);
  }

  @keyframes elegantEntrance {
    from {
      opacity: 0;
      transform: translateY(40px) rotateX(-10deg) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateY(0) rotateX(0deg) scale(1);
    }
  }

  /* Card Content */
  .card-content {
    text-align: center;
    position: relative;
    z-index: 2;
  }

  /* Icon Container */
  .icon-container {
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
    position: relative;
    transition: all 0.4s ease;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }

  .elegant-card:hover .icon-container {
    transform: scale(1.1) rotate(5deg);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  }

  .icon-container svg {
    transition: all 0.3s ease;
  }

  .elegant-card:hover .icon-container svg {
    transform: scale(1.1);
  }

  /* Statistics Counter Animation */
  .stat-number {
    font-size: 2.5rem;
    font-weight: 800;
    color: transparent;
    background: linear-gradient(135deg, #f97316, #dc2626);
    background-clip: text;
    -webkit-background-clip: text;
    margin-bottom: 0.5rem;
    transition: all 0.4s ease;
    position: relative;
  }

  .elegant-card:hover .stat-number {
    transform: scale(1.1);
    text-shadow: 0 0 30px rgba(249, 115, 22, 0.5);
  }

  .stat-label {
    font-size: 0.875rem;
    color: #9ca3af;
    font-weight: 500;
    transition: all 0.3s ease;
  }

  .elegant-card:hover .stat-label {
    color: #e5e7eb;
    transform: translateY(-2px);
  }

  /* Decorative Elements */
  .card-decoration {
    position: absolute;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(220, 38, 38, 0.2));
    animation: decorationFloat 4s ease-in-out infinite;
  }

  .decoration-1 {
    width: 6px;
    height: 6px;
    top: 20px;
    right: 20px;
    animation-delay: 0s;
  }

  .decoration-2 {
    width: 4px;
    height: 4px;
    bottom: 20px;
    left: 20px;
    animation-delay: 2s;
  }

  @keyframes decorationFloat {
    0%, 100% {
      opacity: 0.3;
      transform: translateY(0px) scale(1);
    }
    50% {
      opacity: 0.8;
      transform: translateY(-8px) scale(1.2);
    }
  }

  /* Ripple Effect */
  .card-ripple {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(249, 115, 22, 0.1) 0%, transparent 70%);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
    pointer-events: none;
  }

  .elegant-card:hover .card-ripple {
    width: 300px;
    height: 300px;
  }

  /* Hover Transformations */
  .elegant-card:hover {
    transform: translateY(-12px) scale(1.02);
    box-shadow:
      0 25px 50px -12px rgba(0, 0, 0, 0.4),
      0 0 0 1px rgba(249, 115, 22, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
    border-color: rgba(249, 115, 22, 0.3);
  }

  /* Counter Animation */
  @keyframes countUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Mobile Responsive */
  @media (max-width: 768px) {
    .elegant-card {
      padding: 1.5rem;
    }

    .icon-container {
      width: 3rem;
      height: 3rem;
    }

    .stat-number {
      font-size: 2rem;
    }

    .card-entrance-1,
    .card-entrance-2,
    .card-entrance-3 {
      animation: mobileEntrance 0.6s ease-out forwards;
    }

    @keyframes mobileEntrance {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .elegant-card:hover {
      transform: translateY(-6px) scale(1.01);
    }
  }

  /* Performance Optimizations */
  .elegant-card,
  .badge-animated,
  .icon-container,
  .stat-number,
  .stat-label {
    will-change: transform;
  }

  .elegant-card:hover,
  .badge-animated:hover {
    will-change: transform, box-shadow;
  }
</style>

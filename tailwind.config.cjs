/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		'./src/**/*.{js,ts}',
		'./src/**/*.svelte'
	],
	darkMode: 'class', // Enable class-based dark mode
	theme: {
		extend: {
			colors: {
				// Custom color palette optimized for the app
				primary: {
					50: '#eff6ff',
					100: '#dbeafe',
					200: '#bfdbfe',
					300: '#93c5fd',
					400: '#60a5fa',
					500: '#3b82f6',
					600: '#2563eb',
					700: '#1d4ed8',
					800: '#1e40af',
					900: '#1e3a8a',
					950: '#172554'
				},
				slate: {
					50: '#f8fafc',
					100: '#f1f5f9',
					200: '#e2e8f0',
					300: '#cbd5e1',
					400: '#94a3b8',
					500: '#64748b',
					600: '#475569',
					700: '#334155',
					800: '#1e293b',
					900: '#0f172a',
					950: '#020617'
				}
			},
			animation: {
				// Custom animations for better UX
				'fade-in': 'fadeIn 0.5s ease-in-out',
				'slide-up': 'slideUp 0.3s ease-out',
				'bounce-gentle': 'bounceGentle 2s infinite'
			},
			keyframes: {
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				slideUp: {
					'0%': { transform: 'translateY(10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				bounceGentle: {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-5px)' }
				}
			},
			// Optimize spacing scale
			spacing: {
				'18': '4.5rem',
				'88': '22rem',
				'128': '32rem'
			},
			// Optimize border radius
			borderRadius: {
				'xl': '0.75rem',
				'2xl': '1rem',
				'3xl': '1.5rem'
			}
		}
	},
	plugins: [
		// Add custom utilities for better performance
		function({ addUtilities, theme }) {
			const newUtilities = {
				'.text-gradient': {
					'background-clip': 'text',
					'-webkit-background-clip': 'text',
					'-webkit-text-fill-color': 'transparent'
				},
				'.backdrop-blur-sm': {
					'backdrop-filter': 'blur(4px)',
					'-webkit-backdrop-filter': 'blur(4px)'
				}
			}
			addUtilities(newUtilities)
		}
	],
	// Performance optimizations
	corePlugins: {
		// Disable unused utilities in production
		preflight: true,
		container: false, // We'll use custom container classes
		accessibility: false // We'll handle accessibility manually
	}
}

import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess({
		// Enable TypeScript preprocessing
		typescript: true,
		// Enable PostCSS preprocessing
		postcss: true,
		// Enable CSS preprocessing
		scss: false, // We're using TailwindCSS
		// Enable source maps for better debugging
		sourceMap: true
	}),

	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter(),
		
		// Performance optimizations
		alias: {
			$lib: './src/lib',
			$components: './src/lib/components',
			$utils: './src/lib/utils'
		},
		
		// Enable CSRF protection
		csrf: {
			checkOrigin: false
		},
		
		// Optimize prerendering
		prerender: {
			handleHttpError: 'warn'
		}
	}
};

export default config;

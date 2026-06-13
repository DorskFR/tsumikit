import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// Fully prerendered static site (see src/routes/+layout.ts). On GitHub
		// Pages project sites the app is served under /<repo>, so honor BASE_PATH
		// from the Pages workflow; locally it's empty.
		adapter: adapter({ fallback: '404.html' }),
		paths: {
			base: process.env.BASE_PATH ?? '',
		},
	},
};

export default config;

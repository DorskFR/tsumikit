import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// Static SPA — the showcase has no server side. `fallback` makes it a
		// single-page app so it works from any static host.
		adapter: adapter({ fallback: 'index.html' })
	}
};

export default config;

import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const DEMO_EXAMPLE = /\/src\/demo\/(?!framework\/)([^/]+)\/([^/]+)\/[^/]+\.svelte(?:\?raw)?$/;

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		rollupOptions: {
			output: {
				manualChunks(id) {
					const m = DEMO_EXAMPLE.exec(id);
					return m ? `demo-${m[1]}-${m[2]}` : undefined;
				},
			},
		},
	},
});

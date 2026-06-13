// True in the browser, false during SSR / prerender / build. A dependency-free
// stand-in for SvelteKit's `$app/environment` so the kit also works in plain
// Svelte (Vite) projects, not only SvelteKit.
export const browser = typeof document !== 'undefined';

import { flushSync } from 'svelte';
import { isModifiedClick, urlState } from '../../src/lib/url-state.svelte.ts';

/** @param {() => unknown} read @param {unknown[]} seen */
function track(read, seen) {
	return $effect.root(() => {
		$effect(() => {
			seen.push(read());
		});
	});
}

globalThis.__fixture = { flushSync, urlState, isModifiedClick, track };

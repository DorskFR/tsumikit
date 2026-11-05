import { flushSync } from 'svelte';
import { isModifiedClick, urlState } from '../../src/lib/url-state.svelte.ts';

function track(read, seen) {
	return $effect.root(() => {
		$effect(() => {
			seen.push(read());
		});
	});
}

globalThis.__fixture = { flushSync, urlState, isModifiedClick, track };

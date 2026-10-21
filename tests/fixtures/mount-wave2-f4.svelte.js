import { flushSync, mount, unmount } from 'svelte';
import { toasts } from '$lib/stores/toast.svelte';
import Fixture from './Wave2F4Fixture.svelte';

/** @param {Record<string, unknown>} init */
function props(init) {
	let live = $state({});
	Object.assign(live, init);
	return live;
}

globalThis.__fixture = { mount, unmount, flushSync, Fixture, props, toasts };

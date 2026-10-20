import { flushSync, mount, unmount } from 'svelte';
import Fixture from './AtomsAuditFixture.svelte';

/** @param {Record<string, unknown>} init */
function props(init) {
	let live = $state({});
	Object.assign(live, init);
	return live;
}

globalThis.__fixture = { mount, unmount, flushSync, Fixture, props };

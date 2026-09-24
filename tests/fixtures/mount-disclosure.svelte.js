import { flushSync, mount } from 'svelte';
import Fixture from './DisclosureFixture.svelte';

/** @param {Record<string, unknown>} init */
function props(init) {
	let live = $state({});
	Object.assign(live, init);
	return live;
}

globalThis.__fixture = { mount, flushSync, Fixture, props };

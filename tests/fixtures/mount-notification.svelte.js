import { flushSync, mount } from 'svelte';
import Fixture from './NotificationFixture.svelte';

/** @param {Record<string, unknown>} init */
function props(init) {
	const live = $state({ log: [], open: false });
	Object.assign(live, init);
	return live;
}

globalThis.__fixture = { mount, flushSync, Fixture, props };

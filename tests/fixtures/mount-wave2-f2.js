import { flushSync, mount, unmount } from 'svelte';
import Fixture from './Wave2F2Fixture.svelte';

globalThis.__fixture = { mount, unmount, flushSync, Fixture };

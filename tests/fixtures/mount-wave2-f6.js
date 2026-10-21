import { flushSync, mount, unmount } from 'svelte';
import Fixture from './Wave2F6Fixture.svelte';

globalThis.__fixture = { mount, unmount, flushSync, Fixture };

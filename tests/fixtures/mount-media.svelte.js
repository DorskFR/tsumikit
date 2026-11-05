import { flushSync, mount, unmount } from 'svelte';
import Fixture from './MediaFixture.svelte';

globalThis.__fixture = { mount, unmount, flushSync, Fixture };

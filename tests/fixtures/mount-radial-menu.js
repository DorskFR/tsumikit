import { flushSync, mount, unmount } from 'svelte';
import Fixture from './RadialMenuFixture.svelte';

globalThis.__fixture = { mount, unmount, flushSync, Fixture };

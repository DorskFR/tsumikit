import { flushSync, mount, unmount } from 'svelte';
import Fixture from './HitOverlayFixture.svelte';

globalThis.__fixture = { mount, unmount, flushSync, Fixture };

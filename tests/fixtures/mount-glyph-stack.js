import { flushSync, mount, unmount } from 'svelte';
import Fixture from './GlyphStackFixture.svelte';

globalThis.__fixture = { mount, unmount, flushSync, Fixture };

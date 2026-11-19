import { flushSync, mount, unmount } from 'svelte';
import Fixture from './ToneChipFixture.svelte';

globalThis.__fixture = { mount, unmount, flushSync, Fixture };

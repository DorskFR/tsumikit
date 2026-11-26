import { flushSync, mount, unmount } from 'svelte';
import Fixture from './SegmentedToneFixture.svelte';

globalThis.__fixture = { mount, unmount, flushSync, Fixture };

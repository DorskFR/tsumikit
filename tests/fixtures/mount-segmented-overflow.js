import { flushSync, mount, unmount } from 'svelte';
import Fixture from './SegmentedOverflowFixture.svelte';

globalThis.__fixture = { mount, unmount, flushSync, Fixture };

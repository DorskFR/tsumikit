import { flushSync, mount, unmount } from 'svelte';
import Fixture from './PopoverTooltipFilterFixture.svelte';

globalThis.__fixture = { mount, unmount, flushSync, Fixture };

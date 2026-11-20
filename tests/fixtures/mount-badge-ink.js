import { flushSync, mount, unmount } from 'svelte';
import Fixture from './BadgeInkFixture.svelte';

globalThis.__fixture = { mount, unmount, flushSync, Fixture };

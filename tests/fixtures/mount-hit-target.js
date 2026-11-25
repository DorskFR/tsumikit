import { flushSync, mount, unmount } from 'svelte';
import Fixture from './HitTargetFixture.svelte';

globalThis.__fixture = { mount, unmount, flushSync, Fixture };

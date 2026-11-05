import { flushSync, mount, unmount } from 'svelte';
import Fixture from './TextareaMirrorFixture.svelte';

globalThis.__fixture = { mount, unmount, flushSync, Fixture };

import { flushSync, mount, unmount } from 'svelte';
import Fixture from './TextareaSteadyFixture.svelte';

globalThis.__fixture = { mount, unmount, flushSync, Fixture };

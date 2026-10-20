import { flushSync, mount, unmount } from 'svelte';
import Fixture from './DataTableStackFixture.svelte';

globalThis.__fixture = { mount, unmount, flushSync, Fixture };

import { flushSync, mount, unmount } from 'svelte';
import Fixture from './DataTableActionsFixture.svelte';

globalThis.__fixture = { mount, unmount, flushSync, Fixture };

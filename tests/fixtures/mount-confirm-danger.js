import { flushSync, mount, unmount } from 'svelte';
import Fixture from './ConfirmDangerFixture.svelte';

globalThis.__fixture = { mount, unmount, flushSync, Fixture };

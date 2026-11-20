import { flushSync, mount, unmount } from 'svelte';
import Fixture from './CardPressFixture.svelte';

globalThis.__fixture = { mount, unmount, flushSync, Fixture };

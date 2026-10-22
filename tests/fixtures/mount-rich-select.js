import { flushSync, mount, unmount } from 'svelte';
import Fixture from './RichSelectFixture.svelte';

globalThis.__fixture = { mount, unmount, flushSync, Fixture };

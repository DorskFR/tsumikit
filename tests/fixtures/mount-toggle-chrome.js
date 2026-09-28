import { flushSync, mount } from 'svelte';
import Fixture from './ToggleChromeFixture.svelte';

globalThis.__fixture = { mount, flushSync, Fixture };

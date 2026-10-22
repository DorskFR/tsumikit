import { flushSync, mount } from 'svelte';
import Fixture from './Wave2F3Fixture.svelte';

globalThis.__fixture = { mount, flushSync, Fixture };

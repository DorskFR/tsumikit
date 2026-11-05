import { flushSync, mount } from 'svelte';
import Fixture from './BackdropFixture.svelte';

globalThis.__fixture = { mount, flushSync, Fixture };

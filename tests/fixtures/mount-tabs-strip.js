import { flushSync, mount } from 'svelte';
import Fixture from './TabsStripFixture.svelte';

globalThis.__fixture = { mount, flushSync, Fixture };

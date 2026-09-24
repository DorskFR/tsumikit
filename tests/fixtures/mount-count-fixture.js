import { flushSync, mount } from 'svelte';
import Fixture from './CountIndicatorFixture.svelte';

globalThis.__fixture = { mount, flushSync, Fixture };

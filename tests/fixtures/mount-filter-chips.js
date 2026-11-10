import { flushSync, mount } from 'svelte';
import Fixture from './FilterChipsFixture.svelte';

globalThis.__fixture = { mount, flushSync, Fixture };

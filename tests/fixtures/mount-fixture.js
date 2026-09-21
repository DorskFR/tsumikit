import { flushSync, mount } from 'svelte';
import Fixture from './FilterInputDisplayFixture.svelte';

globalThis.__fixture = { mount, flushSync, Fixture };

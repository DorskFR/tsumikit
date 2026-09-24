import { flushSync, mount } from 'svelte';
import Fixture from './MenuOpenFixture.svelte';

globalThis.__fixture = { mount, flushSync, Fixture };

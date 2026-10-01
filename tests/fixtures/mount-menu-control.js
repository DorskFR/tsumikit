import { flushSync, mount } from 'svelte';
import Fixture from './MenuControlFixture.svelte';

globalThis.__fixture = { mount, flushSync, Fixture };

import { flushSync, mount } from 'svelte';
import Fixture from './TouchTargetsFixture.svelte';

globalThis.__fixture = { mount, flushSync, Fixture };

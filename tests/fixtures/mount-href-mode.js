import { flushSync, mount } from 'svelte';
import Fixture from './HrefModeFixture.svelte';

globalThis.__fixture = { mount, flushSync, Fixture };

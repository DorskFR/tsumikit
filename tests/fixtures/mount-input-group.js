import { flushSync, mount } from 'svelte';
import Fixture from './InputGroupFixture.svelte';

globalThis.__fixture = { mount, flushSync, Fixture };

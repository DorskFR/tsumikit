import { flushSync, mount } from 'svelte';
import Fixture from './DataTableFixture.svelte';

globalThis.__fixture = { mount, flushSync, Fixture };

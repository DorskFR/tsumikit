import { flushSync, mount } from 'svelte';
import Fixture from './DataTableRowFixture.svelte';

globalThis.__fixture = { mount, flushSync, Fixture };

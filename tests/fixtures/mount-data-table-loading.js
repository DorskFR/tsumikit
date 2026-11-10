import { flushSync, mount } from 'svelte';
import Fixture from './DataTableLoadingFixture.svelte';

globalThis.__fixture = { mount, flushSync, Fixture };

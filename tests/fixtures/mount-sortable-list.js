import { flushSync, mount } from 'svelte';
import Fixture from './SortableListFixture.svelte';

globalThis.__fixture = { mount, flushSync, Fixture };

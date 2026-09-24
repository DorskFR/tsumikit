import { flushSync, mount } from 'svelte';
import Fixture from './SplitButtonFixture.svelte';

globalThis.__fixture = { mount, flushSync, Fixture };

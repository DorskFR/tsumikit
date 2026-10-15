import { flushSync, mount } from 'svelte';
import Fixture from './StackedButtonFixture.svelte';

globalThis.__fixture = { mount, flushSync, Fixture };

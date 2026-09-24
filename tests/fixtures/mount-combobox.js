import { flushSync, mount } from 'svelte';
import Fixture from './ComboboxFixture.svelte';

globalThis.__fixture = { mount, flushSync, Fixture };

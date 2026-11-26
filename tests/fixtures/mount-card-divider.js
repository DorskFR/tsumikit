import { flushSync, mount } from 'svelte';
import Fixture from './CardDividerFixture.svelte';

globalThis.__fixture = { mount, flushSync, Fixture };

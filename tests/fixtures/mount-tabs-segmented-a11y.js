import { flushSync, mount } from 'svelte';
import Fixture from './TabsSegmentedA11yFixture.svelte';

globalThis.__fixture = { mount, flushSync, Fixture };

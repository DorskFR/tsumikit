import { flushSync, mount } from 'svelte';
import Fixture from './OptionDescriptionFixture.svelte';

globalThis.__fixture = { mount, flushSync, Fixture };

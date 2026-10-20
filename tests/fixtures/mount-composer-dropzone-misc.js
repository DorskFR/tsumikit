import { flushSync, mount } from 'svelte';
import Fixture from './ComposerDropzoneMiscFixture.svelte';

globalThis.__fixture = { mount, flushSync, Fixture };

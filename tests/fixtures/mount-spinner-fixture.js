import { flushSync, mount } from 'svelte';
import Fixture from './SpinnerVariantsFixture.svelte';

globalThis.__fixture = { mount, flushSync, Fixture };

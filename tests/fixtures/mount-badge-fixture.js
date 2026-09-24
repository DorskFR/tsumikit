import { flushSync, mount } from 'svelte';
import Fixture from './BadgeActionFixture.svelte';

globalThis.__fixture = { mount, flushSync, Fixture };

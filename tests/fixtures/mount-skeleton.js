import { flushSync, mount } from 'svelte';
import Fixture from './SkeletonFixture.svelte';

globalThis.__fixture = { mount, flushSync, Fixture };

import { flushSync, mount } from 'svelte';
import Fixture from './ClusterControlSizeFixture.svelte';

globalThis.__fixture = { mount, flushSync, Fixture };

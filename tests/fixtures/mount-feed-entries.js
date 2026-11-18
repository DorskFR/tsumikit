import { flushSync, mount } from 'svelte';
import Fixture from './FeedEntriesFixture.svelte';

globalThis.__fixture = { mount, flushSync, Fixture };

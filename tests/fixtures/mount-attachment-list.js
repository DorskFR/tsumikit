import { flushSync, mount } from 'svelte';
import Fixture from './AttachmentListFixture.svelte';

globalThis.__fixture = { mount, flushSync, Fixture };

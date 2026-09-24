import { flushSync, mount } from 'svelte';
import Fixture from './AvatarFixture.svelte';

globalThis.__fixture = { mount, flushSync, Fixture };

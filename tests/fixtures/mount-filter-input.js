import { flushSync, mount } from 'svelte';
import FilterInput from '../../src/lib/components/molecules/FilterInput.svelte';

globalThis.__fixture = { mount, flushSync, FilterInput };

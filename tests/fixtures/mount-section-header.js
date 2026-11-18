import { createRawSnippet, flushSync, mount } from 'svelte';
import SectionHeader from '../../src/lib/components/molecules/SectionHeader.svelte';

globalThis.__fixture = { mount, flushSync, createRawSnippet, SectionHeader };

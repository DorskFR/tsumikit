import { flushSync, mount } from 'svelte';
import SelectButton from '../../src/lib/components/molecules/SelectButton.svelte';
import { fontScale } from '../../src/lib/stores/fontscale.svelte.ts';
import { theme } from '../../src/lib/stores/theme.svelte.ts';

globalThis.__fixture = { mount, flushSync, SelectButton, fontScale, theme };

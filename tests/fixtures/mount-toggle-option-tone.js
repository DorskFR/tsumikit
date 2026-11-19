import { flushSync, mount } from 'svelte';
import OptionButton from '../../src/lib/components/molecules/OptionButton.svelte';
import Toggle from '../../src/lib/components/molecules/Toggle.svelte';

globalThis.__fixture = { mount, flushSync, Toggle, OptionButton };

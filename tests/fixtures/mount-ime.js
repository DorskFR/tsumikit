import { flushSync, mount } from 'svelte';
import Input from '../../src/lib/components/atoms/Input.svelte';
import Textarea from '../../src/lib/components/atoms/Textarea.svelte';
import Composer from '../../src/lib/components/molecules/Composer.svelte';
import FilterInput from '../../src/lib/components/molecules/FilterInput.svelte';

globalThis.__fixture = { mount, flushSync, Input, Textarea, Composer, FilterInput };

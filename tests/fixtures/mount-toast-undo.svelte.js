import { flushSync } from 'svelte';
import { toasts } from '$lib/stores/toast.svelte';

globalThis.__fixture = { flushSync, toasts };

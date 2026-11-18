import { flushSync, mount } from 'svelte';
import Toaster from '$lib/components/molecules/Toaster.svelte';
import { toasts } from '$lib/stores/toast.svelte';

globalThis.__fixture = { mount, flushSync, Toaster, toasts };

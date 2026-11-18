import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import ResizablePanel from '$lib/components/layouts/ResizablePanel.svelte';

const panel = createRawSnippet(() => ({ render: () => '<p>Panel</p>' }));

globalThis.__fixture = { mount, unmount, flushSync, ResizablePanel, panel };

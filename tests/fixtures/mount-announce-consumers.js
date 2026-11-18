import { flushSync, mount, unmount } from 'svelte';
import CopyButton from '../../src/lib/components/molecules/CopyButton.svelte';
import WorkingDir from '../../src/lib/components/molecules/WorkingDir.svelte';

globalThis.__fixture = { mount, unmount, flushSync, CopyButton, WorkingDir };

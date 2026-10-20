import { flushSync, mount } from 'svelte';
import Artwork from '../../src/lib/components/atoms/Artwork.svelte';
import Avatar from '../../src/lib/components/atoms/Avatar.svelte';
import Dot from '../../src/lib/components/atoms/Dot.svelte';
import Slider from '../../src/lib/components/atoms/Slider.svelte';
import { autoresize } from '../../src/lib/autoresize.ts';
import { copyToClipboard } from '../../src/lib/clipboard.ts';

globalThis.__fixture = { mount, flushSync, Artwork, Avatar, Dot, Slider, autoresize, copyToClipboard };

import { flushSync, mount } from 'svelte';
import Icon from '../../src/lib/components/atoms/Icon.svelte';
import ChatBubble from '../../src/lib/components/molecules/ChatBubble.svelte';
import CodeBlock from '../../src/lib/components/molecules/CodeBlock.svelte';
import Prose from '../../src/lib/components/molecules/Prose.svelte';
import { renderTrustedMarkdown } from '../../src/lib/markdown.ts';
import { FX_PREPAINT, FX_PREPAINT_HASH } from '../../src/lib/stores/fx.svelte.ts';
import { THEME_PREPAINT, THEME_PREPAINT_HASH } from '../../src/lib/stores/theme.svelte.ts';

globalThis.__fixture = {
	mount,
	flushSync,
	Icon,
	ChatBubble,
	CodeBlock,
	Prose,
	renderTrustedMarkdown,
	FX_PREPAINT,
	FX_PREPAINT_HASH,
	THEME_PREPAINT,
	THEME_PREPAINT_HASH
};

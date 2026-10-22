<script module>
	export const meta = {
		title: 'Safety and overflow',
		caption: 'renderMarkdown escapes raw HTML and keeps only http(s), mailto, relative and #anchor links; long tokens and wide tables wrap, long code lines scroll inside their block.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Prose, renderMarkdown } from '@dorsk/tsumikit';
	import { hostile } from './data';
</script>

<Prose html={renderMarkdown(hostile)} />

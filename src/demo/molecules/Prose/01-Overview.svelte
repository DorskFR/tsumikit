<script module>
	export const meta = {
		title: 'Release notes',
		caption: 'html={renderMarkdown(source)}: headings, lists, a quote, a table, a fenced code block and autolinked URLs.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Prose, renderMarkdown } from '@dorsk/tsumikit';
	import { releaseNotes } from './data';
</script>

<Prose html={renderMarkdown(releaseNotes)} />

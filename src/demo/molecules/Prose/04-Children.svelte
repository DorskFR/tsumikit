<script module>
	export const meta = {
		title: 'Own markup and options',
		caption: 'children styles hand-written markup; renderMarkdown(src, { tables: false, autolink: false, highlight }) turns features off or plugs a highlighter.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { escapeHtml, Prose, renderMarkdown } from '@dorsk/tsumikit';

	const source = 'Tables off: | a | b |\n\nAutolink off: https://example.com\n\n```sql\nSELECT * FROM services WHERE status = \'danger\';\n```';
	const keywords = (code: string) => escapeHtml(code).replace(/\b(SELECT|FROM|WHERE)\b/g, '<span class="hljs-keyword">$1</span>');
</script>

<Prose>
	<h4>On-call handover</h4>
	<p>Two alerts are still open. Check <code>worker-02</code> before the 09:00 deploy.</p>
	<ul>
		<li><strong>cache-01</strong>: memory alarm, acknowledged</li>
		<li><em>search-index</em>: slow queries, investigating</li>
	</ul>
</Prose>
<Prose html={renderMarkdown(source, { tables: false, autolink: false, highlight: keywords })} />

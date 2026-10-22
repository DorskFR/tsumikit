<script lang="ts">
	import { Card, CodeBlock, CopyButton, Disclosure, Heading, Text } from '@dorsk/tsumikit';
	import { highlight } from './highlight';
	import type { DemoExample } from './registry';

	let { example }: { example: DemoExample } = $props();

	const layout = $derived(example.meta.layout ?? 'row');
	const previewStyle = $derived(example.meta.height ? `--example-h: ${example.meta.height}` : '');
	let origin = $state('');
	const link = $derived(`${origin}#${example.id}`);
	$effect(() => {
		origin = `${location.origin}${location.pathname}`;
	});
</script>

<Card padding="none" class="example" id={example.id}>
	<header class="example__head">
		<div class="example__title">
			<Heading level={3} size="sm"><a href="#{example.id}">{example.meta.title}</a></Heading>
			{#if example.meta.caption}<Text as="p" variant="caption" tone="muted">{example.meta.caption}</Text>{/if}
		</div>
		<CopyButton text={link} label="Copy link" showLabel={false} box="sm" />
	</header>
	<div
		class="example__preview example__preview--{layout}"
		class:example__preview--resizable={example.meta.resizable}
		style={previewStyle}
	>
		<example.component />
	</div>
	<Disclosure size="compact" class="example__code">
		{#snippet header()}Code · {example.file}{/snippet}
		<CodeBlock code={example.source} lang="svelte" {highlight} />
	</Disclosure>
</Card>

<style>
	:global(.example) {
		scroll-margin-top: calc(var(--header-h) + var(--sp-4));
		overflow: clip;
	}
	.example__head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--sp-3);
		padding: var(--sp-3) var(--sp-4);
		border-bottom: 1px solid var(--border);
	}
	.example__title {
		display: flex;
		flex-direction: column;
		gap: var(--sp-1);
		min-width: 0;
	}
	.example__title a {
		color: inherit;
		text-decoration: none;
	}
	@media (hover: hover) and (pointer: fine) {
		.example__title a:hover {
			text-decoration: underline;
		}
	}
	.example__preview {
		--example-h: auto;
		padding: var(--sp-4);
		min-height: var(--example-h);
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--sp-3);
		background: var(--bg);
	}
	.example__preview--stack {
		flex-direction: column;
		align-items: stretch;
		flex-wrap: nowrap;
	}
	.example__preview--grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
		align-items: start;
	}
	.example__preview--center {
		justify-content: center;
		min-height: max(var(--example-h), 8rem);
	}
	.example__preview--frame {
		display: block;
		padding: 0;
		height: var(--example-h);
		overflow: auto;
		container: main / inline-size;
	}
	.example__preview--resizable {
		resize: horizontal;
		overflow: auto;
		max-width: 100%;
		min-width: 12rem;
		border-right: 1px dashed var(--border);
	}
	:global(.example__code) {
		border-top: 1px solid var(--border);
	}
	:global(.example__code pre) {
		overflow-x: auto;
	}
</style>

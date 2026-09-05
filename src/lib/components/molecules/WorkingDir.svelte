<script lang="ts">
	// Working-directory chip that abbreviates fish-style as its slot narrows:
	// ancestors shrink to their first letter left → right, then the leaf alone,
	// then the leaf ellipsised down to `minLeaf` chars. Candidate generation
	// lives in `$lib/working-dir`; this component only measures and picks.
	import Badge from '$lib/components/atoms/Badge.svelte';
	import Icon, { type IconName } from '$lib/components/atoms/Icon.svelte';
	import { copyToClipboard } from '$lib/clipboard';
	import { normalizeWorkingDir, workingDirCandidates } from '$lib/working-dir';

	let {
		path,
		minLeaf = 18,
		mono = true,
		full = false,
		icon = 'folder',
		title,
		copy = false,
		copiedLabel = 'Copied',
		oncopy,
		class: klass = '',
		style = ''
	}: {
		path: string;
		/** Char floor the chip reserves so the (truncated) leaf is always legible. */
		minLeaf?: number;
		mono?: boolean;
		/** Skip the fit algorithm: render the whole path and size to content. */
		full?: boolean;
		icon?: IconName;
		/** Defaults to the full path. */
		title?: string;
		/** Render as a button that copies the full path on click. */
		copy?: boolean;
		copiedLabel?: string;
		oncopy?: (ok: boolean) => void;
		class?: string;
		style?: string;
	} = $props();

	const normalized = $derived(normalizeWorkingDir(path));
	const candidates = $derived(workingDirCandidates(path, { minLeaf }));

	let avail = $state(Infinity);
	let chPx = $state(8);
	let chrome = $state(0);
	let rail: HTMLSpanElement | undefined = $state();
	let txt: HTMLSpanElement | undefined = $state();
	let probe: HTMLSpanElement | undefined = $state();
	let status = $state('');
	let timer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		if (!rail || full) return;
		const measure = () => {
			avail = rail!.clientWidth;
			if (probe) chPx = probe.getBoundingClientRect().width / 10 || chPx;
			const badgeEl = txt?.parentElement;
			if (badgeEl && txt) chrome = Math.max(0, badgeEl.offsetWidth - txt.offsetWidth);
		};
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(rail);
		return () => ro.disconnect();
	});

	const shown = $derived.by(() => {
		if (full) return normalized;
		const budget = Math.max(0, avail - chrome - 1);
		return candidates.find((c) => c.length * chPx <= budget) ?? candidates[candidates.length - 1];
	});

	async function onclick(e: MouseEvent) {
		e.stopPropagation();
		const ok = await copyToClipboard(normalized);
		oncopy?.(ok);
		status = ok ? copiedLabel : 'Copy failed';
		clearTimeout(timer);
		timer = setTimeout(() => {
			status = '';
		}, 1500);
	}
</script>

<span
	data-tsu="WorkingDir"
	class="rail {klass}"
	class:full
	bind:this={rail}
	{style}
>
	<Badge
		as={copy ? 'button' : 'span'}
		{mono}
		style="min-width:0;max-width:100%;overflow:hidden;text-align:left"
		title={title ?? normalized}
		onpointerdown={copy ? (e: PointerEvent) => e.stopPropagation() : undefined}
		onclick={copy ? onclick : undefined}
	>
		<Icon name={icon} />
		<span class="text" bind:this={txt}>{shown}</span>
		{#if !full}
			<span class="probe" bind:this={probe} aria-hidden="true">{'0'.repeat(10)}</span>
		{/if}
	</Badge>
	{#if copy}
		<span class="sr-only" role="status" aria-live="polite">{status}</span>
	{/if}
</span>

<style>
	.rail {
		display: flex;
		align-items: center;
		flex: 1 1 0;
		min-width: 0;
		min-height: max-content;
		overflow: hidden;
	}
	.rail.full {
		flex: none;
		max-width: 100%;
	}
	.text {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	.probe {
		position: absolute;
		visibility: hidden;
		white-space: pre;
		pointer-events: none;
	}
</style>

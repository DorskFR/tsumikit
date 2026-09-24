<script lang="ts" generics="T">
	// Listbox of suggestions for a text field the consumer renders as `children`
	// (an Input for plain autocomplete, a Textarea for `@`/`#` mentions). The kit
	// owns the listbox, its placement, the field's combobox ARIA (applied to the
	// wrapped element imperatively, since the field is not ours) and the keys;
	// the consumer decides *when* it is open and what the options are.
	import { tick, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { type AnchorRect, placeAt } from '$lib/floating';
	import { caretRect, comboboxAction } from './combobox-keyboard.js';

	type FieldEl = HTMLInputElement | HTMLTextAreaElement;
	type Placement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
	type CloseReason = 'escape' | 'blur' | 'select';

	type Own = {
		options: T[];
		/** Whether the listbox shows. The kit only ever sets it to `false`. */
		open?: boolean;
		/** Highlighted option. */
		index?: number;
		/** Accessible name of the listbox. */
		label: string;
		/** The wrapped field; defaults to the first `input`/`textarea` in `children`. */
		el?: FieldEl | null;
		/** Float under the field's edge, or under the text caret. */
		anchor?: 'field' | 'caret';
		placement?: Placement;
		gap?: number;
		/** Arrow keys wrap at the ends. */
		loop?: boolean;
		/** Home/End jump the highlight instead of moving the caret. */
		homeEnd?: boolean;
		/** Keys that pick the highlighted option. */
		selectOn?: readonly ('Enter' | 'Tab')[];
		/** Close when focus leaves the field and the listbox. */
		closeOnBlur?: boolean;
		/** `role="combobox"` on the field: `auto` applies it to an `input` only,
		 *  since ARIA in HTML forbids it on a `textarea`. */
		fieldRole?: 'auto' | 'combobox' | 'none';
		getKey?: (option: T, index: number) => string | number;
		/** Default row text when no `option` snippet is given. */
		getLabel?: (option: T) => string;
		onselect?: (option: T, index: number) => void;
		onclose?: (reason: CloseReason) => void;
		option?: Snippet<[T, { active: boolean; index: number }]>;
		/** Shown instead of rows when `options` is empty; without it the listbox hides. */
		empty?: string | Snippet;
		children: Snippet;
		class?: string;
		style?: string;
		panelClass?: string;
		panelStyle?: string;
	};

	let {
		options,
		open = $bindable(false),
		index = $bindable(0),
		label,
		el = null,
		anchor = 'field',
		placement = 'bottom-start',
		gap = 4,
		loop = true,
		homeEnd = false,
		selectOn = ['Enter', 'Tab'],
		closeOnBlur = true,
		fieldRole = 'auto',
		getKey,
		getLabel = (o) => String(o),
		onselect,
		onclose,
		option,
		empty,
		children,
		class: klass = '',
		style: styleProp = '',
		panelClass = '',
		panelStyle = '',
		...rest
	}: Omit<HTMLAttributes<HTMLDivElement>, keyof Own> & Own = $props();

	const id = `cb-${Math.random().toString(36).slice(2, 8)}`;
	const optionId = (i: number) => `${id}-o${i}`;

	let wrapEl = $state<HTMLDivElement | null>(null);
	let panelEl = $state<HTMLDivElement | null>(null);
	const found = $derived(wrapEl?.querySelector<FieldEl>('input, textarea') ?? null);
	const field = $derived(el ?? found);
	const visible = $derived(open && (options.length > 0 || empty !== undefined));
	const active = $derived(options.length ? Math.min(Math.max(index, 0), options.length - 1) : -1);

	const FIELD_ATTRS = [
		'role',
		'aria-autocomplete',
		'aria-haspopup',
		'aria-expanded',
		'aria-controls',
		'aria-activedescendant',
	];

	$effect(() => {
		const f = field;
		if (!f) return;
		return () => {
			for (const a of FIELD_ATTRS) f.removeAttribute(a);
		};
	});

	$effect(() => {
		const f = field;
		if (!f) return;
		const role =
			fieldRole === 'combobox' || (fieldRole === 'auto' && f.tagName === 'INPUT') ? 'combobox' : null;
		if (role) f.setAttribute('role', role);
		else f.removeAttribute('role');
		f.setAttribute('aria-autocomplete', 'list');
		f.setAttribute('aria-haspopup', 'listbox');
		f.setAttribute('aria-expanded', String(visible));
		if (visible) f.setAttribute('aria-controls', id);
		else f.removeAttribute('aria-controls');
		if (visible && active >= 0) f.setAttribute('aria-activedescendant', optionId(active));
		else f.removeAttribute('aria-activedescendant');
	});

	function anchorRect(f: FieldEl): AnchorRect {
		return anchor === 'caret' ? caretRect(f) : f.getBoundingClientRect();
	}

	function reposition() {
		const f = field;
		if (!visible || !f || !panelEl) return;
		const r = anchorRect(f);
		panelEl.style.width = anchor === 'field' ? `${r.width}px` : '';
		placeAt(r, panelEl, placement, gap);
	}

	$effect(() => {
		const p = panelEl;
		if (!visible || !p) return;
		try {
			p.showPopover();
		} catch {}
		reposition();
		addEventListener('scroll', reposition, true);
		addEventListener('resize', reposition);
		return () => {
			removeEventListener('scroll', reposition, true);
			removeEventListener('resize', reposition);
			try {
				p.hidePopover();
			} catch {}
		};
	});

	$effect(() => {
		void options.length;
		void anchor;
		void placement;
		if (visible) tick().then(reposition);
	});

	$effect(() => {
		if (!visible || active < 0) return;
		const row = panelEl?.children[active] as HTMLElement | undefined;
		row?.scrollIntoView?.({ block: 'nearest' });
	});

	function close(reason: CloseReason) {
		if (!open) return;
		open = false;
		onclose?.(reason);
	}

	function select(i: number) {
		const o = options[i];
		if (o === undefined) return;
		onselect?.(o, i);
		close('select');
	}

	function onKeydown(e: KeyboardEvent) {
		const action = comboboxAction(e, {
			open: visible,
			count: options.length,
			index: active,
			loop,
			homeEnd,
			selectOn,
		});
		if (!action) return;
		e.preventDefault();
		e.stopPropagation();
		if (action.type === 'move') index = action.index;
		else if (action.type === 'select') select(active);
		else close('escape');
	}

	function onFocusOut(e: FocusEvent) {
		if (!closeOnBlur) return;
		const to = e.relatedTarget as Node | null;
		if (to && wrapEl?.contains(to)) return;
		close('blur');
	}
</script>

<div
	bind:this={wrapEl}
	{...rest}
	data-tsu="Combobox"
	class="cb {klass}"
	style={styleProp}
	onkeydowncapture={onKeydown}
	onfocusout={onFocusOut}
	oninput={reposition}
	onclick={reposition}
>
	{@render children()}
	{#if visible}
		<div
			bind:this={panelEl}
			{id}
			popover="manual"
			role="listbox"
			aria-label={label}
			class="cb-panel {panelClass}"
			class:cb-caret={anchor === 'caret'}
			style={panelStyle}
		>
			{#each options as o, i (getKey ? getKey(o, i) : i)}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div
					id={optionId(i)}
					role="option"
					tabindex={-1}
					aria-selected={i === active}
					class="cb-option"
					class:active={i === active}
					onpointerdown={(e) => e.preventDefault()}
					onpointerenter={() => (index = i)}
					onclick={() => select(i)}
				>
					{#if option}{@render option(o, { active: i === active, index: i })}{:else}{getLabel(o)}{/if}
				</div>
			{:else}
				<div class="cb-empty">
					{#if typeof empty === 'string'}{empty}{:else if empty}{@render empty()}{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.cb {
		position: relative;
		min-width: 0;
	}
	.cb-panel {
		position: fixed;
		margin: 0;
		inset: auto;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: var(--cb-min-width, 10rem);
		max-width: calc(100vw - 2 * var(--sp-3));
		max-height: var(--cb-max-height, min(16rem, 40vh));
		overflow-y: auto;
		padding: var(--sp-1);
		background: var(--cb-bg, var(--bg-elevated));
		color: var(--text);
		border: 1px solid var(--cb-border, var(--border-strong));
		border-radius: var(--cb-radius, var(--r-md));
		box-shadow: var(--shadow-md);
	}
	.cb-panel.cb-caret {
		max-width: min(22rem, calc(100vw - 2 * var(--sp-3)));
	}
	.cb-option {
		padding: var(--sp-1) var(--sp-2);
		border-radius: var(--r-sm);
		font-size: var(--fs-sm);
		cursor: pointer;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.cb-option.active {
		background: var(--cb-active-bg, var(--bg-elevated-2));
	}
	.cb-empty {
		padding: var(--sp-1) var(--sp-2);
		font-size: var(--fs-sm);
		color: var(--text-muted);
	}
</style>

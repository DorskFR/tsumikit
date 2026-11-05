<div style="padding: 10px">inline</div>
<div style:margin-top="0.5rem">directive</div>

<style>
	.bad {
		padding: 10px 2px;
		margin: 0.5rem auto;
		gap: 3px;
		inset: 7px;
		top: -0.25rem;
	}
	.ok {
		padding: var(--sp-2) var(--sp-4);
		margin: 0 auto;
		gap: 1px;
		top: -1px;
		inset: 0;
		left: 50%;
		padding-inline: calc(var(--sp-4) + 1px);
		margin-block: 1em;
		width: 10px;
		--pad: 10px;
	}
	.ignored {
		/* tsumikit-lint-ignore spacing-scale */
		padding: 10px;
	}
</style>

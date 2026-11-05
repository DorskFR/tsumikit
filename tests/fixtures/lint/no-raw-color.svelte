<div style="color: #abc">inline</div>
<div style:background="rgb(1, 2, 3)">directive</div>
<div style="color: var(--text)">ok</div>

<style>
	:root {
		--brand: #ff0000;
		--tint: hsl(200 50% 50%);
	}
	[data-theme='dark'] .x {
		color: #fff;
	}
	.bad {
		color: #333;
		background: rgba(0, 0, 0, 0.5);
		border-color: hsl(10deg 20% 30%);
	}
	.ok {
		--local: #123456;
		color: var(--text);
		background: hsl(var(--mh) 50% 50%);
		border-color: rgb(from var(--accent) r g b / 50%);
		background-image: url("data:image/svg+xml,%3Csvg fill='%23fff'%3E");
		mask: url(#clip);
		color-scheme: dark;
	}
	.ignored {
		/* tsumikit-lint-ignore no-raw-color */
		color: #999;
		background: #888; /* tsumikit-lint-ignore */
	}
</style>

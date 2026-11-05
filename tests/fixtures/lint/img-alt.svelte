<script>
	let { rest } = $props();
</script>

<img src="a.png" />
<img src="b.png" alt="" />
<img src="c.png" alt="A cat" />
<img src="d.png" {...rest} />
<!-- tsumikit-lint-ignore img-alt -->
<img src="e.png" />

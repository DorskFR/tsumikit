<script lang="ts">
	import Skeleton from '../../src/lib/components/atoms/Skeleton.svelte';
</script>

<Skeleton data-testid="text" lines={3} />
<Skeleton data-testid="single" width="9rem" />
<Skeleton data-testid="bars" lines={3} height="0.85em" />
<Skeleton data-testid="circle" circle height="40px" />
<Skeleton data-testid="aspect" aspect="2/3" width="8rem" />
<Skeleton data-testid="control" control />
<Skeleton data-testid="pulse" variant="pulse" lines={2} radius="var(--r-pill)" />

<script lang="ts">
	let { size = 2, color = 'accent' }: { size?: number; color?: string } = $props();
</script>

<div
	class="bg-{color} animate-pulse rounded-full size-{size} absolute top-0 right-0 flex items-center justify-center"
>
	<p class="sr-only">pip</p>
</div>

<script lang="ts">
	import type { Logs } from '$lib/logs.svelte';
	import { cn } from '$lib/utils';
	// import SvelteVirtualList from '@humanspeak/svelte-virtual-list';
	import { watch } from 'runed';
	import ScrollArea from './ui/scroll-area/scroll-area.svelte';
	import Sonner from './ui/sonner/sonner.svelte';

	let { logs, class: className }: { logs: Logs['logs']; class?: string } = $props();
	const ts_fmt = (d: Date) =>
		`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

	// let ref: SvelteVirtualList;
	// watch(
	// 	() => logs.length,
	// 	() => {
	// 		ref.scroll({ index: logs.length - 1 });
	// 	}
	// );
</script>

<ScrollArea class={className}>
	<!-- <SvelteVirtualList -->
	<!-- 	items={logs} -->
	<!-- 	containerClass={className} -->
	<!-- 	contentClass="text-sm" -->
	<!-- 	itemsClass="" -->
	<!-- 	debug -->
	<!-- 	bind:this={ref} -->
	<!-- > -->
	<!-- 	{#snippet renderItem(log)} -->
	<!-- 	{/snippet} -->
	<!-- </SvelteVirtualList> -->
	<ul class="min-h-0 text-sm whitespace-pre-wrap">
		{#each logs as log}
			{@const timestamp = log.timestamp ? new Date(log.timestamp) : null}
			<li
				class={cn(
					'flex flex-row gap-x-2',
					'hover:bg-primary/10 rounded-sm px-1 ',
					log.kind === 'STDERR' ? 'text-destructive' : ''
				)}
			>
				<span class="opacity-40">{timestamp ? ts_fmt(timestamp) : ''}</span><span
					>{log.message}</span
				>
			</li>
		{/each}
	</ul>
</ScrollArea>

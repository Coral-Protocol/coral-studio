<script lang="ts">
	import type { Logs } from '$lib/logs.svelte';
	import { cn } from '$lib/utils';
	// import SvelteVirtualList from '@humanspeak/svelte-virtual-list';
	import { watch } from 'runed';
	import ScrollArea from './ui/scroll-area/scroll-area.svelte';
	import Sonner from './ui/sonner/sonner.svelte';
	import { Spinner } from './ui/spinner';
	import * as Card from './ui/card';

	let { logs, class: className }: { logs?: Logs; class?: string } = $props();
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
	{#if !logs || logs.state === 'connecting'}
		<div class="flex size-full items-center justify-center">
			<Spinner class="size-10" />
		</div>
	{:else if logs.state === 'closed'}
		<div class="flex size-full items-center justify-center">
			<Card.Root>
				<Card.Header>
					<Card.Title>An error has occurred.</Card.Title>
				</Card.Header>
				<Card.Content>
					<Card.Description
						><p>Connection to agent logs has closed.</p>
						<p>Try reloading the page!</p></Card.Description
					>
				</Card.Content>
			</Card.Root>
		</div>
	{:else}
		<ul class="min-h-0 text-sm whitespace-pre-wrap">
			{#each logs.logs as log}
				{@const timestamp = null}
				<!-- {@const timestamp = log.timestamp ? new Date(log.timestamp) : null} -->
				<li
					class={cn(
						'flex flex-row gap-x-2',
						'hover:bg-primary/10 rounded-sm px-1 ',
						log.type === 'error' ? 'text-destructive' : '',
						log.type === 'warning' ? 'text-orange-400' : ''
					)}
				>
					<span class="opacity-40">{timestamp ? ts_fmt(timestamp) : ''}</span><span>{log.text}</span
					>
				</li>
			{/each}
		</ul>
	{/if}
</ScrollArea>

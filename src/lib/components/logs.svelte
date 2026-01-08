<script lang="ts">
	import type { Logs } from '$lib/logs.svelte';
	import { cn } from '$lib/utils';
	// import SvelteVirtualList from '@humanspeak/svelte-virtual-list';
	import { watch } from 'runed';
	import ScrollArea from './ui/scroll-area/scroll-area.svelte';
	import Sonner from './ui/sonner/sonner.svelte';
	import { Spinner } from './ui/spinner';
	import * as Card from './ui/card';
	import type { Component } from 'svelte';

	import IconWarning from 'phosphor-icons-svelte/IconWarningRegular.svelte';
	import IconWarningCircle from 'phosphor-icons-svelte/IconWarningCircleRegular.svelte';
	import IconInfo from 'phosphor-icons-svelte/IconInfoRegular.svelte';

	let { logs, class: className }: { logs?: Logs | null; class?: string } = $props();
	const ts_fmt = (d: Date) =>
		`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

	const icons: { [K in Logs['logs'][number]['type']]: Component<{ class?: string }> } = {
		error: IconWarning,
		info: IconInfo,
		warning: IconWarningCircle
	};

	const typeColors: { [K in Logs['logs'][number]['type']]: string | null } = {
		error: 'text-destructive',
		info: null,
		warning: 'text-orange-400'
	};

	// let ref: SvelteVirtualList;
	// watch(
	// 	() => logs.length,
	// 	() => {
	// 		ref.scroll({ index: logs.length - 1 });
	// 	}
	// );
</script>

<ScrollArea class={cn('rounded-md border', className)}>
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
			{#each logs.logs as log, i (i)}
				{@const timestamp = null}
				{@const LogIcon = icons[log.type]}
				<!-- {@const timestamp = log.timestamp ? new Date(log.timestamp) : null} -->
				<li
					class={cn(
						'flex flex-row items-center gap-x-1 px-2 py-1 pr-3',
						'hover:bg-primary/10 rounded-sm ',
						typeColors[log.type],
						i % 2 == 0 && 'bg-sidebar'
					)}
				>
					<LogIcon class={cn('opacity-50', typeColors[log.type])} />
					<span class="opacity-40">{timestamp ? ts_fmt(timestamp) : ''}</span><span>{log.text}</span
					>
				</li>
			{/each}
		</ul>
	{/if}
</ScrollArea>

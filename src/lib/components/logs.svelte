<script lang="ts">
	import type { Logs } from '$lib/logs.svelte';
	import { cn } from '$lib/utils';
	// import SvelteVirtualList from '@humanspeak/svelte-virtual-list';
	import { useDebounce, watch } from 'runed';
	import ScrollArea from './ui/scroll-area/scroll-area.svelte';
	import Sonner from './ui/sonner/sonner.svelte';
	import { Spinner } from './ui/spinner';
	import * as Card from './ui/card';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import type { Component } from 'svelte';

	import IconWarning from 'phosphor-icons-svelte/IconWarningRegular.svelte';
	import IconWarningCircle from 'phosphor-icons-svelte/IconWarningCircleRegular.svelte';
	import IconInfo from 'phosphor-icons-svelte/IconInfoRegular.svelte';
	import IconArrowDown from 'phosphor-icons-svelte/IconArrowDownRegular.svelte';
	import IconBug from 'phosphor-icons-svelte/IconBugRegular.svelte';
	import IconPath from 'phosphor-icons-svelte/IconPathRegular.svelte';
	import { Button } from './ui/button';
	import { slide } from 'svelte/transition';

	let { logs, class: className }: { logs?: Logs | null; class?: string } = $props();
	const ts_fmt = (d: Date) =>
		`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

	const icons: { [K in Logs['logs'][number]['type']]: Component<{ class?: string }> } = {
		error: IconWarning,
		info: IconInfo,
		warning: IconWarningCircle,
		debug: IconBug,
		trace: IconPath
	};

	const typeColors: { [K in Logs['logs'][number]['type']]: string | null } = {
		error: 'text-destructive',
		info: null,
		warning: 'text-orange-400',
		debug: 'text-blue-400',
		trace: 'text-muted-foreground'
	};

	let manualScroll = $state(false);
	let scrollArea = $state(null) as HTMLElement | null | undefined;

	const scrollToBottom = () => {
		if (!scrollArea) return;
		scrollArea.scrollTo({ top: scrollArea.scrollHeight, behavior: 'smooth' });
	};

	// auto scroll
	watch([() => logs?.logs.length], () => {
		if (manualScroll) return;
		scrollToBottom();
	});

	// automatically enable auto scroll when we are < 5 pixels from scroll bottom,
	// and disable when far enough from bottom
	$effect(() => {
		if (!scrollArea) return;
		scrollArea.onscroll = useDebounce(() => {
			if (!scrollArea) return;
			const distFromBottom =
				scrollArea.scrollHeight - (scrollArea.scrollTop + scrollArea.clientHeight);
			// console.log({ distFromBottom });
			if (distFromBottom < 5) {
				manualScroll = false;
			} else if (distFromBottom > 20 || distFromBottom / scrollArea.scrollHeight > 0.1) {
				manualScroll = true;
			}
		}, 50);
	});
</script>

<div class={cn('relative overflow-clip rounded-md border', className)}>
	{#if logs && logs.state === 'connected' && manualScroll}
		<div class="absolute right-4 bottom-0 z-10" transition:slide={{ axis: 'y' }}>
			<Button
				size="icon"
				class="mb-4 size-8"
				onclick={() => {
					scrollToBottom();
					manualScroll = false;
				}}
			>
				<span class="sr-only">Scroll to bottom</span><IconArrowDown /></Button
			>
		</div>
	{/if}
	<ScrollArea class="bg-sidebar size-full" bind:viewportRef={scrollArea}>
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
			<ul class="min-h-0 pb-2 text-sm whitespace-pre-wrap">
				{#each logs.logs as log, i (i)}
					{@const LogIcon = icons[log.type]}
					<li
						class={cn(
							'grid grid-cols-[max-content_max-content_auto] items-center gap-x-1 px-2 py-1 pr-3',
							'hover:bg-primary/10 rounded-sm ',
							typeColors[log.type],
							i % 2 == 1 && 'bg-background'
						)}
					>
						<Tooltip.Provider>
							<Tooltip.Root>
								<Tooltip.Trigger class="pr-1 opacity-40">
									<LogIcon class={cn('opacity-50', typeColors[log.type])} />
								</Tooltip.Trigger>
								<Tooltip.Content
									><span class="capitalize select-all">{log.type}</span></Tooltip.Content
								>
							</Tooltip.Root>
						</Tooltip.Provider>
						<Tooltip.Provider>
							<Tooltip.Root>
								<Tooltip.Trigger class="pr-1 opacity-40">
									{ts_fmt(log.timestamp)}
								</Tooltip.Trigger>
								<Tooltip.Content
									><span class="select-all"
										>{log.timestamp.toLocaleDateString()}
										{log.timestamp.getHours()}:{log.timestamp
											.getMinutes()
											.toString()
											.padStart(2, '0')}:{log.timestamp
											.getSeconds()
											.toString()
											.padStart(2, '0')}.{log.timestamp
											.getMilliseconds()
											.toString()
											.padStart(3, '0')}</span
									></Tooltip.Content
								>
							</Tooltip.Root>
						</Tooltip.Provider>
						<span>{log.text}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</ScrollArea>
</div>

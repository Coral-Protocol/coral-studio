<script lang="ts">
	import { page } from '$app/state';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import Input from '$lib/components/ui/input/input.svelte';
	import ScrollAreaScrollbar from '$lib/components/ui/scroll-area/scroll-area-scrollbar.svelte';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import * as Resizable from '$lib/components/ui/resizable';
	import { sessionCtx } from '$lib/threads';
	import type { Message as AgentMessage, Thread } from '$lib/threads';
	import { useDebounce, useIntersectionObserver } from 'runed';
	import { onMount } from 'svelte';
	import Message from './Message.svelte';
	import { afterNavigate, goto } from '$app/navigation';
	import { cn } from '$lib/utils';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Users } from '@lucide/svelte';
	import { pickTextColor, stringToColor } from '$lib/color';
	import type { Session } from '$lib/session.svelte';
	import { Toggle } from '$lib/components/ui/toggle';
	import { SvelteSet } from 'svelte/reactivity';

	let ctx = sessionCtx.get();
	let conn = $derived(ctx.session);

	let {
		thread,
		messages,
		memberListOpen = $bindable(true)
	}: {
		thread: Session['threads'][string];
		messages: AgentMessage[];
		memberListOpen?: boolean;
	} = $props();

	let message = $state('');

	let messagesSet = $derived(
		messages.map((msg) => ({ message: msg, mentions: new Set(msg.mentions) }))
	);

	const agentFilters: SvelteSet<string> = new SvelteSet();

	let filteredMessages = $derived(
		agentFilters.size > 0
			? messagesSet
					.filter(
						(m) => agentFilters.has(m.message.senderId) || !m.mentions.isDisjointFrom(agentFilters)
					)
					.map((m) => m.message)
			: messages
	);

	let root = $state<HTMLElement | null>(null);
</script>

<Resizable.PaneGroup direction="horizontal">
	<Resizable.Pane class="flex h-full">
		<main class="relative flex flex-grow flex-col gap-0 overflow-scroll">
			<ScrollArea class="flex-grow  p-4" bind:ref={root}>
				<div class="flex flex-grow flex-col gap-0">
					{#each filteredMessages as message, i (message.id)}
						<div
							class={cn(
								'border-t border-transparent py-1',
								i == (messages?.length ?? 0) - thread.unread && 'border-red-400'
							)}
						>
							<Message
								session={ctx.session}
								{message}
								agentFilters={agentFilters.size > 0 ? agentFilters : undefined}
							/>
						</div>
					{/each}
				</div>
			</ScrollArea>
		</main>
	</Resizable.Pane>
	{#if memberListOpen}
		<Resizable.Handle withHandle />
		<Resizable.Pane maxSize={60} minSize={5} defaultSize={20} class="flex flex-col gap-2 p-2">
			{#each thread.participants as member}
				{@const memberColor = stringToColor(member)}
				<Toggle
					class="justify-start"
					onPressedChange={(pressed) => {
						pressed ? agentFilters.add(member) : agentFilters.delete(member);
					}}
				>
					<span
						class="size-3 shrink-0 rounded-full"
						style={`background-color: ${memberColor}; border-color: ${memberColor}55;`}
					></span>
					<span class="min-w-0 truncate">{member}</span>
				</Toggle>
			{/each}
		</Resizable.Pane>
	{/if}
</Resizable.PaneGroup>

<script lang="ts">
	import * as Resizable from '$lib/components/ui/resizable';
	import { appContext } from '$lib/context';
	import type { Message as AgentMessage, Thread } from '$lib/threads';
	import Message from './Message.svelte';
	import { cn } from '$lib/utils';
	import { stringToColor } from '$lib/color';
	import type { Session } from '$lib/session.svelte';
	import { Toggle } from '$lib/components/ui/toggle';
	import { SvelteSet } from 'svelte/reactivity';
	import VList from '$lib/components/VList.svelte';

	let ctx = appContext.get();

	let {
		thread,
		messages,
		memberListOpen = $bindable(true)
	}: {
		thread: Session['threads'][string];
		messages: AgentMessage[];
		memberListOpen?: boolean;
	} = $props();

	let messagesSet = $derived(
		messages.map((msg) => ({ message: msg, mentions: new Set(msg.mentionNames) }))
	);

	const agentFilters: SvelteSet<string> = new SvelteSet();

	let filteredMessages = $derived(
		agentFilters.size > 0
			? messagesSet
					.filter(
						(m) =>
							agentFilters.has(m.message.senderName) || !m.mentions.isDisjointFrom(agentFilters)
					)
					.map((m) => m.message)
			: messages
	);
</script>

<Resizable.PaneGroup direction="horizontal">
	<Resizable.Pane class="flex h-full">
		<main class="relative flex flex-grow flex-col gap-0 overflow-scroll">
			<VList
				data={filteredMessages}
				class="flex-grow p-4"
				viewportClass="flex flex-grow flex-col gap-0"
			>
				{#snippet children(message, i)}
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
				{/snippet}
			</VList>
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

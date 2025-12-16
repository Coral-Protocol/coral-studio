<script lang="ts">
	import { pickTextColor, stringToColor } from '$lib/color';
	import * as Card from '$lib/components/ui/card';
	import type { Message } from '$lib/threads';
	import { cn } from '$lib/utils';
	import { ArrowRight, ArrowRightIcon, LogsIcon } from '@lucide/svelte';
	import AgentName from './AgentName.svelte';
	import type { SvelteSet } from 'svelte/reactivity';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { toast } from 'svelte-sonner';
	import Telemetry from '$lib/components/dialogs/telemetry.svelte';
	import type { Session } from '$lib/session.svelte';

	let {
		message,
		agentFilters,
		class: className,
		session
	}: {
		message: Message;
		session?: Session | null;
		agentFilters?: SvelteSet<string>;
		class?: string;
	} = $props();

	let senderColor = $derived(stringToColor(message.senderId));
	let date = $derived(new Date(message.timestamp));
	let mentions = $derived(message.mentions ?? []);
	let telemetryDialogOpen = $state(false);
</script>

{#if session}
	<Telemetry
		bind:open={telemetryDialogOpen}
		{session}
		messageId={message.id}
		threadId={message.threadId}
	/>
{/if}

<Card.Root class={cn('gap-2 py-4', className)}>
	<Card.Header class="flex flex-row gap-1 px-4 text-sm leading-5">
		<AgentName
			color={senderColor}
			name={message.senderId}
			disabled={agentFilters && !agentFilters.has(message.senderId)}
		/>
		<span class="w-max">-></span>
		{#each mentions as mention}
			{@const mentionColor = stringToColor(mention)}
			<AgentName
				color={mentionColor}
				name={mention}
				disabled={agentFilters && !agentFilters.has(mention)}
			/>
		{/each}
		{#if mentions.length == 0}
			<span class="text-muted-foreground">nobody</span>
		{/if}
		<p class="flex-grow text-right" title={message.timestamp?.toString() ?? 'null'}>
			{`${date.toLocaleTimeString()}`}
		</p>

		<!-- Should probably structure the parents better instead of using negative margins here -->
		<div style="margin-right: -6px; margin-top: -6px; padding-left: 4px;">
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					<Button variant="ghost" size="sm">
						<LogsIcon />
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content>
					<DropdownMenu.Group>
						<DropdownMenu.Item
							onclick={() => {
								telemetryDialogOpen = true;
							}}>View Telemetry</DropdownMenu.Item
						>
					</DropdownMenu.Group>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</Card.Header>
	<Card.Content class="px-4 whitespace-pre-wrap">
		{message.content}
	</Card.Content>
</Card.Root>

<script lang="ts">
	import { pickTextColor, stringToColor } from '$lib/color';
	import * as Card from '$lib/components/ui/card';
	import type { Message } from '$lib/threads';
	import { cn } from '$lib/utils';
	import { ArrowRight, ArrowRightIcon } from '@lucide/svelte';

	let {
		message,
		class: className
	}: {
		message: Message;
		class?: string;
	} = $props();

	let senderColor = $derived(stringToColor(message.senderId));
	let date = $derived(new Date(message.timestamp));
	let mentions = $derived(message.mentions ?? []);
</script>

<Card.Root class={cn('gap-2 py-4', className)}>
	<Card.Header class="flex flex-row gap-1 px-4 text-sm leading-5">
		<span
			class={cn('text-primary-foreground rounded-md px-1.5 py-0', pickTextColor(senderColor))}
			style={`background-color: ${senderColor}`}
		>
			{message.senderId}
		</span>
		<span class="w-max">-></span>
		{#each mentions as mention}
			{@const mentionColor = stringToColor(mention)}
			<span
				class={cn(
					'bg-primary text-primary-foreground rounded-md px-1 py-0',
					pickTextColor(mentionColor)
				)}
				style={`background-color: ${mentionColor}`}
			>
				{mention}
			</span>
		{/each}
		{#if mentions.length === 0}
			<span class="text-muted-foreground">nobody</span>
		{/if}
		<p class="flex-grow text-right" title={message.timestamp?.toString() ?? 'null'}>
			{`${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`}
		</p>
	</Card.Header>
	<Card.Content class="px-4">
		{message.content}
	</Card.Content>
</Card.Root>
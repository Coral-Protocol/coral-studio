<script lang="ts">
	import type { components } from '$generated/api';
	import type { Session } from '$lib/session.svelte';

	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { tick } from 'svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import Input from '../ui/input/input.svelte';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import Textarea from '../ui/textarea/textarea.svelte';
	import Checkbox from '../ui/checkbox/checkbox.svelte';
	import Label from '../ui/label/label.svelte';
	import { appContext } from '$lib/context';
	import { toast } from 'svelte-sonner';

	let ctx = appContext.get();

	const {
		agent,
		session
	}: {
		agent: components['schemas']['SessionAgentState'];
		session: Session;
	} = $props();

	let open = $state(false);
	let selectedId = $state('');
	let messageContent = $state('');
	let triggerRef = $state<HTMLButtonElement>(null!);

	let mentions = $state<string[]>([]);
	let openThreads = $derived(
		Object.values(session.threads).filter((thread) => thread.state.state === 'open')
	);

	const selectedThread = $derived(openThreads.find((thread) => thread.id === selectedId));

	function selectThread(threadId: string) {
		selectedId = threadId;
		mentions = [];
	}

	function sendMessage() {
		ctx.server.sendMessage(session.sessionId, agent.name, {
			threadId: selectedId,
			content: messageContent,
			mentions: mentions
		});
		toast.success('Message sent');
	}

	// from docs
	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}
</script>

<p>Message:</p>
<Textarea placeholder="Type your message..." bind:value={messageContent} />

<p>Thread:</p>
<Popover.Root bind:open>
	<Popover.Trigger bind:ref={triggerRef}>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="outline"
				class="w-[200px] justify-between"
				role="combobox"
				aria-expanded={open}
			>
				{selectedThread?.name || 'Select thread...'}
				<ChevronsUpDownIcon class="opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>

	<Popover.Content class="w-[200px] p-0">
		<Command.Root>
			<Command.Input placeholder="Search ..." />
			<Command.List>
				<Command.Empty>No thread found.</Command.Empty>
				<Command.Group value="threads">
					{#each openThreads as thread (thread.id)}
						<Command.Item
							value={thread.name}
							onSelect={() => {
								selectThread(thread.id);
								closeAndFocusTrigger();
							}}
						>
							<CheckIcon class={cn(selectedId !== thread.id && 'text-transparent')} />
							{thread.name}
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>

{#each selectedThread?.participants as participant}
	{#if participant !== agent.name}
		<div class="flex items-start gap-3">
			<Checkbox
				id={participant}
				checked={mentions.includes(participant)}
				onCheckedChange={(checked) => {
					if (mentions.includes(participant)) {
						mentions = mentions.filter((p) => p !== participant);
					} else {
						mentions = [...mentions, participant];
					}
				}}
			/>
			<div class="grid gap-2">
				<Label>Mention @{participant}</Label>
			</div>
		</div>
	{/if}
{/each}

<Button disabled={selectedThread === undefined} onclick={sendMessage}>send</Button>

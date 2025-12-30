<script lang="ts">
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { components } from '$generated/api';
  import { tick } from 'svelte';
  import { cn } from '$lib/utils.js';
	import type { Session } from '$lib/session.svelte';

	let {
    threads,
    selectedId = $bindable(undefined)
	}: {
		threads: Array<Session["threads"]["string"]>,
    selectedId: string | undefined
	} = $props();

	let triggerRef = $state<HTMLButtonElement>(null!);
	let open = $state(false);

  const selectedThread = $derived(threads.find((thread) => thread.id === selectedId));

	// from docs
	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}
</script>

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
					{#each threads as thread (thread.id)}
						<Command.Item
							value={thread.name}
							onSelect={() => {
								selectedId = thread.id;
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

<script lang="ts" generics="Value">
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { tick, type ComponentProps, type Snippet } from 'svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';

	type Entry = Value extends string
		? { label: string; key?: string; value: Value } | string
		: { label: string; key?: string; value: Value };

	let {
		open = $bindable(false),
		disabled = false,
		selected = $bindable(undefined),
		selectPlaceholder = 'Select an item...',
		searchPlaceholder = 'Search items...',
		emptyLabel = 'No items found.',
		options = [],
		onValueChange,

		side,
		align,

		option: optionChild,
		trigger,
		class: className
	}: {
		open?: boolean;
		disabled?: boolean;
		selected?: Entry | undefined;
		options?: { heading?: string; items: Entry[] }[];
		selectPlaceholder?: string;
		searchPlaceholder?: string;
		emptyLabel?: string;
		onValueChange?: (value: Value) => void;

		side?: ComponentProps<typeof Popover.Content>['side'];
		align?: ComponentProps<typeof Popover.Content>['align'];

		option?: Snippet<[{ item: Entry }]>;
		trigger?: Snippet<[{ props: Record<string, unknown> }]>;
		class?: string;
	} = $props();

	let triggerRef = $state(null) as HTMLButtonElement | null;
	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			if (!triggerRef) return;
			triggerRef.focus();
		});
	}

	const getKey = (entry: Entry) => (typeof entry === 'string' ? entry : (entry.key ?? entry.label));
</script>

<Popover.Root bind:open>
	<Popover.Trigger bind:ref={triggerRef} {disabled}>
		{#snippet child({ props })}
			{#if trigger}
				{@render trigger({ props })}
			{:else}
				<Button
					variant="outline"
					{...props}
					class={cn('w-[200px] justify-between', className)}
					role="combobox"
					aria-expanded={open}
				>
					{selected
						? typeof selected === 'string'
							? selected
							: selected.label
						: selectPlaceholder}
					<ChevronsUpDownIcon class="ml-2 size-4 shrink-0 opacity-50" />
				</Button>
			{/if}
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-[200px] p-0" {side} {align}>
		<Command.Root>
			<Command.Input placeholder={searchPlaceholder} />
			<Command.List>
				<Command.Empty>{emptyLabel}</Command.Empty>
				{#each options as group}
					<Command.Group>
						{#each group.items as item}
							<Command.Item
								value={getKey(item)}
								onSelect={() => {
									selected = item;
									onValueChange?.((typeof item === 'string' ? item : item.value) as any); // item is only string when Value is string, so this is safe
									closeAndFocusTrigger();
								}}
							>
								{#if optionChild}
									{@render optionChild({ item })}
								{:else}
									<CheckIcon
										class={cn(
											'mr-2 size-4',
											!selected || (getKey(selected) !== getKey(item) && 'text-transparent')
										)}
									/>
									{typeof item === 'string' ? item : item.label}
								{/if}
							</Command.Item>
						{/each}
					</Command.Group>
				{/each}
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>

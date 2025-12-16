<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { toast } from 'svelte-sonner';

	import IconX from 'phosphor-icons-svelte/IconXRegular.svelte';
	import IconDot from 'phosphor-icons-svelte/IconDotRegular.svelte';
	import CaretUpDown from 'phosphor-icons-svelte/IconCaretUpDownRegular.svelte';

	import Logo from '$lib/icons/logo.svelte';
	import { PersistedState, useDebounce, watch } from 'runed';
	import { Input } from '$lib/components/ui/input';
	import TooltipLabel from './tooltip-label.svelte';
	import Button from './ui/button/button.svelte';
	import { fade } from 'svelte/transition';
	import { onMount, tick, untrack } from 'svelte';
	import type { WithElementRef } from 'bits-ui';

	import Badge from './ui/badge/badge.svelte';
	import { page } from '$app/state';

	let namespaces = new PersistedState<string[]>('namespaces', []);
	let selected = new PersistedState<string | null>('selectedNamespace', null);

	watch([() => namespaces.current], () => {
		if (!selected.current) return;
		if (namespaces.current.indexOf(selected.current) === -1) {
			selected.current = null;
		}
		if (selected.current === null && namespaces.current.length > 0) {
			selected.current = namespaces.current[0] ?? null;
		}
	});

	onMount(() => {
		if (selected.current === null) return;
		onSelect?.(selected.current);
	});

	let dialogOpen = $state(false);
	let duplicate: true | null = $state(null);

	let newNamespace = $state('Untitled Namespace');

	const checkForDupe = (s: string) => {
		if (namespaces.current.indexOf(s) !== -1) {
			duplicate = true;
			return true;
		}
		return false;
	};

	$effect(() => {
		value = selected.current;
	});

	let {
		value = $bindable(null),
		ref = $bindable(null),
		onSelect,
		namespaceAdded
	}: WithElementRef<
		{
			value?: string | null;
			onSelect?: (namespace: string) => void;
			namespaceAdded?: (namespace: string) => void;
		},
		HTMLButtonElement
	> = $props();

	const createNamespace = () => {
		return async (e: Event) => {
			e.preventDefault();
			if (checkForDupe(newNamespace)) {
				return;
			}
			namespaces.current = [...namespaces.current, newNamespace];
			selected.current = newNamespace;
			dialogOpen = false;
			duplicate = null;
			toast.success('Created new namespace.');
			namespaceAdded?.(newNamespace);
		};
	};
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Sidebar.MenuButton
						size="lg"
						bind:ref
						class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground "
						{...props}
					>
						<div>
							<Logo class="text-foreground size-8" />
						</div>
						<div class="flex flex-col gap-0.5 leading-none">
							<span class="font-sans text-xs font-bold tracking-widest uppercase"
								>Coral Console</span
							>
							<span class="">{selected.current === null ? '' : `${selected.current}`}</span>
						</div>
						<CaretUpDown class="ml-auto" />
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="w-(--bits-dropdown-menu-anchor-width)" align="start">
				{#if namespaces.current.length === 0}
					<DropdownMenu.Label class="text-muted-foreground font-normal"
						>No namespaces added.</DropdownMenu.Label
					>
				{/if}
				{#each namespaces.current as namespace (namespace)}
					<DropdownMenu.Item
						onSelect={() => {
							selected.current = namespace;
							onSelect?.(namespace);
						}}
					>
						{namespace}

						<Badge
							variant="outline"
							class="ml-auto
							{selected.current === namespace ? '' : 'hidden'}"
						>
							Selected
						</Badge>
					</DropdownMenu.Item>
				{/each}
				<DropdownMenu.Separator />
				<DropdownMenu.Item onSelect={() => (dialogOpen = true)}>Add namespace</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content>
		<form class="grid w-full gap-4" onsubmit={createNamespace()}>
			<Dialog.Header>
				<Dialog.Title>Create a namespace</Dialog.Title>
			</Dialog.Header>
			<section class="grid grid-cols-2">
				<TooltipLabel>Namespace</TooltipLabel>
				<Input
					placeholder="my namespace"
					maxlength={100}
					bind:value={newNamespace}
					oninput={() => {
						duplicate = null;
					}}
				/>
			</section>
			<Dialog.Footer class="items-center">
				<p class="text-destructive mr-auto text-sm" transition:fade>
					{#if duplicate === true}
						This namespace already exists.
					{/if}
				</p>
				{#if duplicate === true}
					<Button
						variant="outline"
						onclick={() => {
							dialogOpen = false;
							toast.info(`Switched to existing namespace ${newNamespace}`);
						}}>Use</Button
					>
				{/if}
				{#if duplicate !== true}
					<Button
						type="submit"
						onclick={(e) => {
							duplicate = null;
						}}
					>
						<span>Add</span>
					</Button>
				{:else}
					<Button
						onclick={() => {
							duplicate = null;
							newNamespace = '';
						}}
					>
						Clear
					</Button>
				{/if}
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';

	import CheckIcon from 'phosphor-icons-svelte/IconCheckRegular.svelte';
	import CaretUpDown from 'phosphor-icons-svelte/IconCaretUpDownRegular.svelte';

	import Logo from '$lib/icons/logo.svelte';
	import { PersistedState, useDebounce } from 'runed';
	import { Input } from '$lib/components/ui/input';
	import TooltipLabel from './tooltip-label.svelte';
	import Button from './ui/button/button.svelte';
	import { fade } from 'svelte/transition';
	import { onMount, tick, untrack } from 'svelte';
	import type { WithElementRef } from 'bits-ui';

	let servers = new PersistedState<string[]>('servers', []);
	let selected = new PersistedState<string | null>('selectedServer', null);

	$effect(() => {
		const cur = untrack(() => selected.current);
		if (!cur) return;
		if (servers.current.indexOf(cur) === -1) {
			selected.current = null;
		}
		if (selected.current === null && servers.current.length > 0) {
			selected.current = servers.current[0];
		}
	});
	onMount(() => {
		if (selected.current === null) return;
		onSelect?.(selected.current);
	});

	let dialogOpen = $state(false);
	let testSuccess: boolean | null = $state(null);
	let testing = $state(false);

	let host = $state('');

	const debouncedTest = useDebounce(async () => {
		testSuccess = null;
		testing = true;
		try {
			const res = await fetch(`http://${host}/api/v1/agents`);
			await tick();
			testSuccess = res.status === 200;
		} catch {
			await tick();
			testSuccess = false;
		}
		testing = false;
	}, 250);

	const testConnection = () => {
		testSuccess = null;
		testing = true;
		debouncedTest();
	};

	$effect(() => {
		value = selected.current;
	});

	let {
		value = $bindable(null),
		ref = $bindable(null),
		onSelect
	}: WithElementRef<
		{
			value?: string | null;
			onSelect?: (server: string) => void;
		},
		HTMLButtonElement
	> = $props();
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
								>Coral Protocol</span
							>
							<span class="">Studio{selected.current === null ? '' : ` - ${selected.current}`}</span
							>
						</div>
						<CaretUpDown class="ml-auto" />
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="w-(--bits-dropdown-menu-anchor-width)" align="start">
				{#if servers.current.length === 0}
					<DropdownMenu.Label class="text-muted-foreground font-normal"
						>No servers added.</DropdownMenu.Label
					>
				{/if}
				{#each servers.current as server (server)}
					<DropdownMenu.Item
						onSelect={() => {
							selected.current = server;
							onSelect?.(server);
						}}
					>
						{server}
						{#if server === selected.current}
							<CheckIcon class="ml-auto" />
						{/if}
					</DropdownMenu.Item>
				{/each}
				<DropdownMenu.Separator />
				<DropdownMenu.Item onSelect={() => (dialogOpen = true)}>Add a server</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Add a server</Dialog.Title>
			<Dialog.Description></Dialog.Description>
		</Dialog.Header>
		<form>
			<section class="grid grid-cols-2">
				<TooltipLabel>Host</TooltipLabel>
				<Input placeholder="localhost:5555" bind:value={host} onkeypress={testConnection} />
			</section>
		</form>
		<Dialog.Footer class="items-center">
			{#if testSuccess === true}
				<p class="text-sm text-green-400" transition:fade>Connection successful.</p>
			{:else if testSuccess === false}
				<p class="text-destructive text-sm" transition:fade>Connection failed.</p>
			{/if}
			<Button
				variant="outline"
				disabled={testing}
				onclick={(e) => {
					e.preventDefault();
					testSuccess = null;
					testing = true;
					testConnection();
				}}>Test</Button
			>
			<Button
				disabled={testSuccess !== true}
				onclick={() => {
					testSuccess = null;
					servers.current.push(host);
					selected.current = host;
					dialogOpen = false;
					host = '';
				}}>Add</Button
			>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

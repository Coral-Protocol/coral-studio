<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { toast } from 'svelte-sonner';

	import IconX from 'phosphor-icons-svelte/IconXRegular.svelte';
	import IconDot from 'phosphor-icons-svelte/IconDotRegular.svelte';
	import CaretUpDown from 'phosphor-icons-svelte/IconCaretUpDownRegular.svelte';

	import Logo from '$lib/icons/logo.svelte';
	import { PersistedState, useDebounce } from 'runed';
	import { Input } from '$lib/components/ui/input';
	import TooltipLabel from './tooltip-label.svelte';
	import Button from './ui/button/button.svelte';
	import { fade } from 'svelte/transition';
	import { onMount, tick, untrack } from 'svelte';
	import type { WithElementRef } from 'bits-ui';

	import type { paths } from '../../generated/api';
	import createClient from 'openapi-fetch';
	import Badge from './ui/badge/badge.svelte';
	import { page } from '$app/state';

	let servers = new PersistedState<string[]>('servers', []);
	let selected = new PersistedState<string | null>('selectedServer', null);

	$effect(() => {
		const cur = untrack(() => selected.current);
		if (!cur) return;
		if (servers.current.indexOf(cur) === -1) {
			selected.current = null;
		}
		if (selected.current === null && servers.current.length > 0) {
			selected.current = servers.current[0] ?? null;
		}
	});
	onMount(() => {
		if (selected.current === null) return;
		onSelect?.(selected.current);
	});

	let dialogOpen = $state(false);
	let testState: 'success' | 'fail' | 'outdated' | 'dupe' | null = $state(null);
	let testing = $state(false);

	let host = $state(page.url.hostname + ':5173');

	let hostSanitized = $derived(host.replace(/^https?:\/\//, ''));

	const checkForOld = async () => {
		const isOld = await fetch(`${location.protocol}//${hostSanitized}/api/v1/registry`)
			.then((res) => res.status === 200)
			.catch((_) => false);
		if (isOld) {
			testState = 'outdated';
		}
	};

	const checkForDupe = (s: string) => {
		if (servers.current.indexOf(s) !== -1) {
			testState = 'dupe';
			return true;
		}
		return false;
	};

	const debouncedTest = useDebounce(async () => {
		testState = null;
		testing = true;
		if (checkForDupe(hostSanitized)) {
			testing = false;
			return;
		}
		try {
			const client = createClient<paths>({
				baseUrl: `${location.protocol}//${hostSanitized}`
			});
			const res = await client.GET('/api/v1/registry', {});
			await tick();
			testState = res.response.status === 200 ? 'success' : 'fail';
			if (testState === 'success') {
				pushServerAndClose();
			} else {
				await checkForOld();
			}
		} catch {
			await tick();
			testState = 'fail';
		}
		testing = false;
	}, 250);

	const testConnection = () => {
		testState = null;
		testing = true;
		debouncedTest();
	};

	const pushServerAndClose = () => {
		dialogOpen = false;
		servers.current.push(hostSanitized);
		selected.current = hostSanitized;
		testState = null;
		toast.success('Server added to list.');
		host = '127.0.0.1:5555';
		onSelect?.(hostSanitized);
		serverAdded?.(hostSanitized);
		// TODO: why is this required? why doesnt the onSelect work... :(
	};

	$effect(() => {
		value = selected.current;
	});

	let {
		value = $bindable(null),
		ref = $bindable(null),
		onSelect,
		serverAdded
	}: WithElementRef<
		{
			value?: string | null;
			onSelect?: (server: string) => void;
			serverAdded?: (server: string) => void;
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
								>Coral Console</span
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

						<Badge
							variant="outline"
							class="ml-auto
							{selected.current === server ? '' : 'hidden'}"
						>
							Selected
						</Badge>
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
		<form class=" grid w-full gap-4">
			<Dialog.Header>
				<Dialog.Title>Add a server</Dialog.Title>
			</Dialog.Header>
			<section class="grid grid-cols-2">
				<TooltipLabel>Host</TooltipLabel>
				<Input
					placeholder="localhost:5555"
					bind:value={host}
					disabled={testing}
					oninput={() => {
						testState = null;
						testing = false;
						checkForDupe(hostSanitized);
					}}
				/>
			</section>
			<Dialog.Footer class="items-center">
				<p class="text-destructive mr-auto text-sm" transition:fade>
					{#if testState === 'outdated'}
						This server is outdated. See <a
							class="hover:text-background hover:bg-destructive underline"
							href="https://github.com/Coral-Protocol/coral-server/#readme">coral-server's README</a
						>
						for help using the latest version.
					{:else if testState === 'dupe'}
						This server has already been added.
					{:else if testState === 'fail'}
						Connection failed, add anyway?
					{/if}
				</p>
				{#if testState === 'dupe'}
					<Button
						variant="outline"
						onclick={() => {
							selected.current = hostSanitized;
							dialogOpen = false;
							toast.info(`Switched to existing server ${hostSanitized}`);
						}}>Use</Button
					>
				{:else if testState !== null}
					<Button
						variant="outline"
						onclick={() => {
							pushServerAndClose();
						}}>Yes</Button
					>
				{/if}
				{#if testState !== 'dupe'}
					<Button
						type="submit"
						disabled={testing}
						onclick={(e) => {
							testState = null;
							testing = true;
							testConnection();
						}}
					>
						<span class={!testing && testState === null ? '' : 'opacity-0'}>Connect</span>
						<span class="{testing && testState === null ? '' : 'opacity-0'} absolute m-auto"
							>Loading</span
						>
						<span class="{testState !== null && testing ? '' : 'opacity-0'} absolute m-auto"
							>Validating</span
						>
						<span class="{testState !== null && !testing ? '' : 'opacity-0'} absolute m-auto"
							>Retry</span
						>
					</Button>
				{:else}
					<Button
						onclick={() => {
							testState = null;
							testing = false;
							host = '';
						}}
					>
						Clear
					</Button>
				{/if}
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

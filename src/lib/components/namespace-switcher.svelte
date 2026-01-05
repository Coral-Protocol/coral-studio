<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { toast } from 'svelte-sonner';

	import CaretUpDown from 'phosphor-icons-svelte/IconCaretUpDownRegular.svelte';

	import Logo from '$lib/icons/logo.svelte';
	import { watch } from 'runed';
	import { Input } from '$lib/components/ui/input';
	import TooltipLabel from './tooltip-label.svelte';
	import Button from './ui/button/button.svelte';
	import { fade } from 'svelte/transition';
	import type { WithElementRef } from 'bits-ui';

	import Badge from './ui/badge/badge.svelte';
	import { appContext } from '$lib/context';
	import { cn } from '$lib/utils';

	let ctx = appContext.get();
	let namespaces = $derived(ctx.server.namespaces.filter((ns) => ns !== 'default'));

	watch([() => ctx.server.namespaces], () => {
		if (!(ctx.server.namespace in ctx.server.sessions)) {
			ctx.server.namespace = 'default';
		}
	});

	let dialogOpen = $state(false);

	let newNamespace = $state('Untitled Namespace');
	let duplicate = $derived(newNamespace === 'default' || newNamespace in ctx.server.namespaces);

	let { ref = $bindable(null) }: WithElementRef<{}, HTMLButtonElement> = $props();
</script>

{#snippet item(ns: string)}
	<DropdownMenu.Item
		onSelect={() => {
			ctx.server.namespace = ns;
		}}
	>
		{ns}

		<Badge variant="outline" class={cn('ml-auto', ctx.server.namespace === ns ? '' : 'hidden')}>
			Selected
		</Badge>
	</DropdownMenu.Item>
{/snippet}

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
							<span class="">{ctx.server.namespace}</span>
						</div>
						<CaretUpDown class="ml-auto" />
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="w-(--bits-dropdown-menu-anchor-width)" align="start">
				{@render item('default')}
				{#if namespaces.length > 0}
					<DropdownMenu.Separator />
				{/if}
				{#each namespaces as namespace (namespace)}
					{@render item(namespace)}
				{/each}
				<DropdownMenu.Separator class="my-1.5" />
				<DropdownMenu.Item onSelect={() => (dialogOpen = true)}>Add namespace</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content>
		<form
			class="grid w-full gap-4"
			onsubmit={(e) => {
				e.preventDefault();
				ctx.server.namespace = newNamespace;
				if (duplicate) {
					toast.info(`Using existing namespace '${newNamespace}'.`);
				} else {
					toast.info(`Using namespace '${newNamespace}'.`);
					ctx.server.addNamespace(newNamespace);
				}
				newNamespace = '';
				dialogOpen = false;
			}}
		>
			<Dialog.Header>
				<Dialog.Title>Create a namespace</Dialog.Title>
			</Dialog.Header>
			<section class="grid grid-cols-2">
				<TooltipLabel>Namespace</TooltipLabel>
				<Input placeholder="Namespace Name" maxlength={100} bind:value={newNamespace} />
			</section>
			<Dialog.Footer class="items-center">
				{#if duplicate === true}
					<p class="mr-auto text-sm text-orange-400" transition:fade>
						This namespace already exists.
					</p>
				{/if}
				{#if duplicate === true}
					<Button type="submit" variant="outline">Use</Button>
				{:else}
					<Button type="submit">Add</Button>
				{/if}
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

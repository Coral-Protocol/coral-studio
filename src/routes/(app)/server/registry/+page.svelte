<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import * as Card from '$lib/components/ui/card';
	import * as Item from '$lib/components/ui/item';
	import * as InputGroup from '$lib/components/ui/input-group';

	import { Input } from '$lib/components/ui/input';
	import { Separator } from '$lib/components/ui/separator';
	import * as Dialog from '$lib/components/ui/dialog/index.js';

	import IconCrane from 'phosphor-icons-svelte/IconCraneRegular.svelte';
	import { appContext } from '$lib/context';
	import IconMagnifyingGlassRegular from 'phosphor-icons-svelte/IconMagnifyingGlassRegular.svelte';
	import { fade } from 'svelte/transition';
	import { Badge } from '$lib/components/ui/badge';
	import { Skeleton } from '$lib/components/ui/skeleton';

	let ctx = appContext.get();

	let search = $state('');
	let searchLower = $derived(search.trim().toLocaleLowerCase());

	let filtered = $derived(
		Object.values(ctx.server.catalogs).map((catalog) => {
			if (searchLower.length == 0) return { ...catalog, agents: Object.values(catalog.agents) };
			return {
				...catalog,
				agents: Object.values(catalog.agents).filter(
					(agent) => agent.name.toLocaleLowerCase().indexOf(search) !== -1
				)
			};
		})
	);
	let filteredCount = $derived(filtered.reduce((acc, cur) => acc + cur.agents.length, 0));
</script>

<header class="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4">
	<Sidebar.Trigger class="-ml-1" />
	<Separator orientation="vertical" class="mr-2 h-4" />
	<Breadcrumb.Root class="flex-grow">
		<Breadcrumb.List>
			<Breadcrumb.Item class="hidden md:block">
				<Breadcrumb.Link>Server</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator class="hidden md:block" />
			<Breadcrumb.Item>
				<Breadcrumb.Page>Agent Registry</Breadcrumb.Page>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>
</header>
<main class="m-auto h-full max-w-3xl p-4">
	<header class="mb-2">
		<InputGroup.Root>
			<InputGroup.Input placeholder="Search..." bind:value={search} />
			<InputGroup.Addon>
				<IconMagnifyingGlassRegular />
			</InputGroup.Addon>

			<InputGroup.Addon align="inline-end"
				>{#if search.length > 0}
					<span transition:fade={{ duration: 100 }}>{filteredCount} results</span>
				{/if}
			</InputGroup.Addon>
		</InputGroup.Root>
	</header>
	{#each filtered as catalog}
		<Card.Root>
			<Card.Header>
				<Card.Title
					>{catalog.identifier.type.charAt(0).toLocaleUpperCase() +
						catalog.identifier.type.slice(1)} Agents</Card.Title
				>
			</Card.Header>
			<Card.Content class="flex  flex-col gap-2">
				{#if catalog.agents.length == 0}
					<span class="text-muted-foreground">No agents found.</span>
				{/if}
				{#each catalog.agents as agent}
					<Dialog.Root>
						<Dialog.Trigger class="text-left"
							><Item.Root variant="outline" class="hover:bg-sidebar p-2 px-2.5">
								<Item.Content>
									<Item.Title
										>{agent.name}{#each agent.versions as version}<Badge variant="outline"
												>{version}</Badge
											>{/each}
									</Item.Title>
									<Item.Description class="line-clamp-1 truncate">
										{#await ctx.server.lookupAgent( { name: agent.name, version: agent.versions[0]!, registrySourceId: catalog.identifier } )}
											<Skeleton class="h-4 w-full" />
										{:then details}
											{details.registryAgent.info.description}
										{/await}
									</Item.Description>
								</Item.Content>
							</Item.Root></Dialog.Trigger
						>
						<Dialog.Content>
							<Dialog.Header>
								<Dialog.Title>{agent.name}</Dialog.Title>
								<Dialog.Description class="min-h-52">
									{#await ctx.server.lookupAgent( { name: agent.name, version: agent.versions[0]!, registrySourceId: catalog.identifier } )}
										<Skeleton class="h-4 w-full" />
									{:then details}
										{details.registryAgent.info.description}
									{/await}
								</Dialog.Description>
							</Dialog.Header>
						</Dialog.Content>
					</Dialog.Root>
				{/each}
			</Card.Content>
		</Card.Root>
	{/each}
</main>

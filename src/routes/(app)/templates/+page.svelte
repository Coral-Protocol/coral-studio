<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import AgentGraph from '$lib/components/AgentGraph.svelte';
	import TwostepButton from '$lib/components/twostep-button.svelte';

	const templates = $state<string[]>([]);

	onMount(() => {
		try {
			const rawIndex = localStorage.getItem('template_index');

			if (!rawIndex) {
				localStorage.setItem('template_index', JSON.stringify([]));
				templates.length = 0;
				return;
			}

			const parsed = JSON.parse(rawIndex);

			if (!Array.isArray(parsed)) {
				console.error('Invalid template index format, resetting.');
				localStorage.setItem('template_index', JSON.stringify([]));
				templates.length = 0;
				return;
			}

			const validTemplates = parsed.filter((name: string) => {
				const exists = localStorage.getItem(`template_${name}`);
				if (!exists) {
					console.warn(`Template ${name} missing, removing from index.`);
				}
				return !!exists;
			});

			if (validTemplates.length !== parsed.length) {
				localStorage.setItem('template_index', JSON.stringify(validTemplates));
			}

			templates.splice(0, templates.length, ...validTemplates);
		} catch (error) {
			console.error('Error loading templates, resetting.', error);
			localStorage.setItem('template_index', JSON.stringify([]));
			templates.length = 0;
		}
	});

	const removeTemplate = (name: string) => {
		try {
			localStorage.removeItem(`template_${name}`);
			const index = templates.indexOf(name);
			if (index !== -1) {
				templates.splice(index, 1);
			}
			toast.success('Template removed successfully!');
		} catch (error) {
			console.error('Error removing template:', error);
			toast.error('Failed to remove template.');
		}
	};
</script>

<header class="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4">
	<Sidebar.Trigger class="-ml-1" />
	<Separator orientation="vertical" class="mr-2 h-4" />
	<Breadcrumb.Root class="flex-grow">
		<Breadcrumb.List>
			<Breadcrumb.Item class="hidden md:block">
				<Breadcrumb.Link>Templates</Breadcrumb.Link>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>
</header>

<Button variant="outline" href="/templates/create">Create new template</Button>

{#if templates.length > 0}
	<ul class="mt-4 grid grid-cols-4 gap-2 p-4">
		{#each templates as template}
			{@const templateData = JSON.parse(localStorage.getItem(`template_${template}`) || '{}')}
			{@const graphData = templateData.data ? JSON.parse(templateData.data) : {}}
			<li>
				<Card.Root>
					<Dialog.Root>
						<Card.Content>
							<Card.Header>
								<Card.Title>{template}</Card.Title>
							</Card.Header>
							<Dialog.Trigger class=" w-full">
								<AgentGraph
									agents={graphData.agentGraphRequest?.agents || []}
									groups={graphData.agentGraphRequest?.groups || []}
								/>
							</Dialog.Trigger>
							<Dialog.Content>
								<Dialog.Header>
									<Dialog.Title>{template}</Dialog.Title>
									<Dialog.Description>
										created at, does x, has y agents, max cost, ttl, raw, etc
										{graphData.agentGraphRequest?.agents?.length} agents, {graphData
											.agentGraphRequest?.groups?.length} groups
										<!-- <pre>{templateData.data}</pre> -->
									</Dialog.Description>
								</Dialog.Header>
							</Dialog.Content>
						</Card.Content>
					</Dialog.Root>

					<Card.Footer class="flex gap-2">
						<Button>Edit</Button>
						<TwostepButton
							class="hover:bg-destructive/50 my-2 grow truncate"
							onclick={() => removeTemplate(template)}>Delete</TwostepButton
						>
						<Button>Download</Button>
						<Button>Run</Button>
						<Button>Open</Button>
					</Card.Footer>
				</Card.Root>
			</li>
		{/each}
	</ul>
{:else}
	<p class="text-muted-foreground mt-4">No templates found. Create a new one to get started!</p>
{/if}

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
	import * as Accordion from '$lib/components/ui/accordion';
	import { Share } from '@lucide/svelte';

	const templates = $state<string[]>([]);

	const download = (templateName: string) => {
		try {
			const data = localStorage.getItem(`template_${templateName}`);
			if (!data) {
				throw new Error('Template data not found');
			}
			const blob = new Blob([data], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${templateName}.json`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Error downloading template:', error);
		}
	};

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

	function importTemplate() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'application/json';
		input.onchange = async () => {
			if (input.files && input.files[0]) {
				try {
					const file = input.files[0];
					const text = await file.text();
					const data = JSON.parse(text);
					if (!data.name || !data.data) {
						throw new Error('Invalid template format');
					}
					localStorage.setItem(`template_${data.name}`, JSON.stringify(data));
					if (!templates.includes(data.name)) {
						templates.push(data.name);
					}
					toast.success('Template imported successfully!');
					try {
						const templateIndex = JSON.parse(localStorage.getItem('template_index') || '[]');
						const updatedIndex = [...new Set([...templateIndex, data.name])];
						localStorage.setItem('template_index', JSON.stringify(updatedIndex));
					} catch (error) {
						console.error('Error updating template index:', error);
					}
				} catch (error) {
					console.error('Error importing template:', error);
					toast.error('Failed to import template. Make sure it is a valid JSON file.');
				}
			}
		};
		input.click();
	}

	let dialogOpen = $state(false);
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

<section class="mx-auto my-8 flex gap-2">
	<Button variant="outline" href="/templates/create" class=" w-fit">Create new template</Button>
	<Button variant="outline" onclick={() => importTemplate()} class="w-fit">Import from file</Button>
</section>

{#if templates.length > 0}
	<ul class="grid grid-cols-[repeat(auto-fit,minmax(12rem,28rem))] gap-2 p-4">
		{#each templates as template}
			{@const templateData = JSON.parse(localStorage.getItem(`template_${template}`) || '{}')}
			{@const graphData = templateData.data ? JSON.parse(templateData.data) : {}}
			<li class="col-span-1">
				<Card.Root>
					<Dialog.Root bind:open={dialogOpen}>
						<Card.Content class="flex flex-col gap-4">
							<Card.Header class="px-0">
								<Card.Title>Template</Card.Title>
								<Card.Description>{template}</Card.Description>
							</Card.Header>
							<Dialog.Trigger
								class=" bg-sidebar hover:bg-accent-foreground/10 w-full overflow-clip rounded-lg transition-all"
							>
								<AgentGraph
									agents={graphData.agentGraphRequest?.agents || []}
									groups={graphData.agentGraphRequest?.groups || []}
								/>
							</Dialog.Trigger>
							<Dialog.Content class="w-fit max-w-fit min-w-fit">
								<Dialog.Header>
									<Dialog.Title>{template}</Dialog.Title>
									<Dialog.Description>
										<ol>
											<li>Created at: {new Date(templateData.updated).toLocaleString()}</li>
											<li>
												Has {graphData.agentGraphRequest?.agents?.length ?? 0} agents and {graphData
													.agentGraphRequest?.groups?.length ?? 0} groups
											</li>
										</ol>

										<Separator class="my-2" />

										<section class="flex h-[400px] w-[800px] max-w-[800px] gap-2 overflow-hidden">
											<div class="bg-sidebar aspect-square w-[400px] overflow-clip rounded-lg">
												<AgentGraph
													agents={graphData.agentGraphRequest?.agents || []}
													groups={graphData.agentGraphRequest?.groups || []}
												/>
											</div>

											<Accordion.Root
												type="single"
												value="item-1"
												class="aspect-square max-h-[400px] w-[400px] max-w-[400px] overflow-clip rounded-lg border"
											>
												<Accordion.Item value="item-1">
													<Accordion.Trigger class="w-[400px] grow" variant="compact"
														>Description</Accordion.Trigger
													>
													<Accordion.Content
														class="max-h-[340px] min-h-0 w-[400px] overflow-x-hidden overflow-y-scroll"
													>
														<pre>{templateData.description ?? 'no description'}</pre>
													</Accordion.Content>
												</Accordion.Item>
												<Accordion.Item value="item-2">
													<Accordion.Trigger class="w-[400px] grow" variant="compact"
														>Data</Accordion.Trigger
													>
													<Accordion.Content class="max-h-[280px] min-h-0 grow overflow-y-scroll">
														<pre>{templateData.data}</pre>
													</Accordion.Content>
												</Accordion.Item>
											</Accordion.Root>
										</section>
										<Separator class="my-2" />
									</Dialog.Description>
									<Dialog.Footer class="flex justify-start gap-2">
										<Button href={`/templates/create?template=${template}`}>Edit</Button>
										<TwostepButton
											class="hover:bg-destructive/50 "
											onclick={() => removeTemplate(template)}>Delete</TwostepButton
										>
										<Button onclick={() => download(template)}>Download</Button>
										<Button class="ml-auto">Run</Button>
									</Dialog.Footer>
								</Dialog.Header>
							</Dialog.Content>

							<Card.Footer class="flex justify-between gap-2 border-t px-0">
								<Button class="self-start" variant="ghost">Share</Button>
								<Button onclick={() => (dialogOpen = true)}>Open</Button>
							</Card.Footer>
						</Card.Content>
					</Dialog.Root>
				</Card.Root>
			</li>
		{/each}
	</ul>
{:else}
	<p class="text-muted-foreground m-auto">No templates found. Create a new one to get started!</p>
{/if}

<script lang="ts">
	import TemplateViewer from './TemplateViewer.svelte';

	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';

	import Separator from '$lib/components/ui/separator/separator.svelte';
	import AgentGraph from '$lib/components/AgentGraph.svelte';

	import IconWarningCircleRegular from 'phosphor-icons-svelte/IconWarningCircleRegular.svelte';

	let templates = $state<string[]>([]);

	let dialogOpen = $state(false);
	let overwriteWarning = $state(false);
	let pendingImport: any = null; // store template data awaiting confirmation
	let template = $state('');
	let templateData = $state<{ name?: string; data?: string }>({});
	let graphData = $state({});

	onMount(() => {
		fetchTemplates();
	});

	const fetchTemplates = (name?: string) => {
		// if (name) {
		// 	const data = localStorage.getItem(`template_${name}`);
		// 	if (data) {
		// 		if (!templates.includes(name)) {
		// 			templates = [...templates, name];
		// 		}
		// 	} else {
		// 		toast.error(`Template ${name} not found.`);
		// 		templates = templates.filter((t) => t !== name);
		// 	}
		// 	return;
		// }
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

		templates = templates;
	};

	function importTemplate() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'application/json';
		input.onchange = async () => {
			if (!input.files?.[0]) return;

			try {
				const file = input.files[0];
				const text = await file.text();
				const data = JSON.parse(text);

				if (!data.name || !data.data) throw new Error('Invalid template format');

				// Check if template exists
				if (localStorage.getItem(`template_${data.name}`)) {
					pendingImport = data; // store template for later
					overwriteWarning = true; // open the dialog
					return; // pause here until user confirms
				}

				// Otherwise, import immediately
				saveTemplate(data);
			} catch (error) {
				console.error('Error importing template:', error);
				toast.error('Failed to import template. Make sure it is a valid JSON file.');
			}
		};
		input.click();
	}

	function saveTemplate(data: any) {
		data.imported = true;
		localStorage.setItem(`template_${data.name}`, JSON.stringify(data));

		const templateIndex = [...new Set([...(templates || []), data.name])];
		templates = templateIndex;

		localStorage.setItem('template_index', JSON.stringify(templateIndex));
		toast.success('Template imported successfully!');
	}

	const openTemplate = (name: string) => {
		template = name;
		templateData = JSON.parse(localStorage.getItem(`template_${name}`) || '{}');
		graphData = templateData?.data ? JSON.parse(templateData.data) : {};
		dialogOpen = true;
	};

	const refresh = (name?: string) => {
		if (name) {
			const data = localStorage.getItem(`template_${name}`);
			if (data) {
				templateData = JSON.parse(data);
				graphData = templateData.data ? JSON.parse(templateData.data) : {};
			}
			templates = templates.filter((t) => t !== name).concat(name); // move to end to trigger re-render
		} else {
			fetchTemplates();
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

<section class="mx-auto my-8 flex gap-2">
	<Button variant="outline" href="/templates/create" class=" w-fit">Create new template</Button>
	<Button variant="outline" onclick={() => importTemplate()} class="w-fit">Import from file</Button>
</section>

<TemplateViewer
	{template}
	{templateData}
	{graphData}
	bind:open={dialogOpen}
	bind:templates
	onRefresh={(name) => refresh(name)}
/>

<AlertDialog.Root bind:open={overwriteWarning}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Template already exists</AlertDialog.Title>
			<AlertDialog.Description>
				This template already exists. Do you want to overwrite it?
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel
				onclick={() => {
					pendingImport = null;
					overwriteWarning = false;
				}}
			>
				Cancel
			</AlertDialog.Cancel>
			<AlertDialog.Action
				onclick={() => {
					if (pendingImport) {
						saveTemplate(pendingImport);
						pendingImport = null;
					}
					overwriteWarning = false;
				}}
			>
				Overwrite
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

{#key templates}
	{#if templates.length > 0}
		<ul class="grid grid-cols-[repeat(auto-fit,minmax(12rem,28rem))] gap-2 p-4">
			{#key templates}
				{#each templates as template}
					{@const templateData = JSON.parse(localStorage.getItem(`template_${template}`) || '{}')}
					{@const graphData = templateData.data ? JSON.parse(templateData.data) : {}}

					<li class="col-span-1">
						<Card.Root>
							<Dialog.Root bind:open={dialogOpen}>
								<Card.Content class="flex flex-col gap-4">
									<Card.Header class="relative flex justify-between px-0">
										<Card.Title>{template}</Card.Title>
										{#if templateData.imported}
											<Tooltip.Provider>
												<Tooltip.Root delayDuration={0}>
													<Tooltip.Trigger
														class="text-accent absolute right-0 opacity-70 hover:opacity-100"
														><IconWarningCircleRegular class="size-5" /></Tooltip.Trigger
													>
													<Tooltip.Content>
														<p>Imported from external source</p>
													</Tooltip.Content>
												</Tooltip.Root>
											</Tooltip.Provider>
										{/if}
									</Card.Header>
									<button
										class=" bg-sidebar hover:bg-accent-foreground/10 w-full overflow-clip rounded-lg transition-all"
										onclick={() => openTemplate(template)}
									>
										<AgentGraph
											agents={graphData.agentGraphRequest?.agents || []}
											groups={graphData.agentGraphRequest?.groups || []}
											options={{
												disableZoom: true,
												disableDrag: true,
												disableBrush: true,
												nodeSubLabel: null,
												selectedNodeId: null
											}}
										/>
									</button>

									<Card.Footer class="flex justify-between gap-2 border-t px-0">
										<Button class="self-start" variant="ghost">Share</Button>
										<Button onclick={() => openTemplate(template)}>View</Button>
									</Card.Footer>
								</Card.Content>
							</Dialog.Root>
						</Card.Root>
					</li>
				{/each}
			{/key}
		</ul>
	{:else}
		<p class="text-muted-foreground m-auto">No templates found. Create a new one to get started!</p>
	{/if}
{/key}

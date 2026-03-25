<script lang="ts">
	import TemplateViewer from './TemplateViewer.svelte';

	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';

	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';

	import IconPencilRegular from 'phosphor-icons-svelte/IconPencilFill.svelte';
	import IconDownloadRegular from 'phosphor-icons-svelte/IconDownloadFill.svelte';

	import Separator from '$lib/components/ui/separator/separator.svelte';
	import AgentGraph from '$lib/components/AgentGraph.svelte';

	import IconWarningCircleRegular from 'phosphor-icons-svelte/IconWarningCircleRegular.svelte';
	import type { TemplateV1 } from './TemplateV1';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import {
		normalizeTemplate,
		refreshTemplateFromStorage,
		fetchTemplatesFromStorage,
		fetchBundledTemplates,
		safeJSONParse,
		pickAndParseTemplateFile,
		checkTemplateOverwrite,
		saveTemplateToLocalStorage,
		downloadTemplate
	} from './TemplateLib';

	let templates = $state<string[]>([]);
	let bundledTemplateMap = $state<Map<string, TemplateV1>>(new Map());

	let dialogOpen = $state(false);
	let overwriteWarning = $state(false);
	let pendingImport: any = null; // store template data awaiting confirmation
	let template = $state('');
	let templateData = $state<TemplateV1>({} as TemplateV1);
	let payload = $state({}) as any;
	let loading = $state(true);

	onMount(() => {
		for (const bt of fetchBundledTemplates()) {
			bundledTemplateMap.set(bt.name, bt);
		}

		const builtInNames = [...bundledTemplateMap.keys()];
		const localTemplates = fetchTemplatesFromStorage();
		templates = [...builtInNames, ...localTemplates.filter(t => !bundledTemplateMap.has(t))];
		loading = false;
	});

	async function importTemplate() {
		const result = await pickAndParseTemplateFile();

		if (!result.success) {
			toast.error(result.error);
			return;
		}

		const template = result.data;

		if (checkTemplateOverwrite(template.name)) {
			pendingImport = template;
			overwriteWarning = true;
			return;
		}

		const saveResult = saveTemplateToLocalStorage(template);

		if (!saveResult.success) {
			toast.error(saveResult.error ?? 'Error importing template');
			return;
		}

		toast.success(
			saveResult.overwrite ? 'Template updated successfully!' : 'Template saved successfully!'
		);
	}

	function saveTemplate(data: any) {
		const normalized = normalizeTemplate(data);
		normalized.trusted = true;

		try {
			localStorage.setItem(`template_${normalized.name}`, JSON.stringify(normalized));

			const templateIndex = [...new Set([...(templates || []), normalized.name])];

			templates = templateIndex;
			localStorage.setItem('template_index', JSON.stringify(templateIndex));

			toast.success('Template imported successfully!');
		} catch {
			toast.error('Failed to save template.');
		}
	}

	const openTemplate = (name: string) => {
		template = name;

		const bundledTpl = bundledTemplateMap.get(name);
		if (bundledTpl?.payload?.data) {
			sessionStorage.setItem('bundledTemplatePayload', bundledTpl.payload.data);
			goto(`${base}/templates/create?bundledTemplate=${name}`);
			return;
		}

		const raw = localStorage.getItem(`template_${name}`);
		const parsed = normalizeTemplate(safeJSONParse(raw, {}));

		templateData = parsed;
		payload = safeJSONParse(parsed.payload.data);

		dialogOpen = true;
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
	<Button
		variant="outline"
		href="{base}/templates/create"
		class=" {templates.length > 0 && !loading ? '' : 'border-accent/50!'} w-fit"
		>Create new template</Button
	>
	<Button variant="outline" onclick={() => importTemplate()} class="w-fit">Import from file</Button>
</section>

<TemplateViewer
	{template}
	{payload}
	{templateData}
	bind:open={dialogOpen}
	bind:templates
	onRefresh={() => (templates = fetchTemplatesFromStorage())}
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
	{#if templates.length > 0 && !loading}
		<ul
			class="grid grid-cols-[repeat(auto-fit,minmax(20rem,24em))] justify-center gap-4 overflow-y-scroll p-4"
		>
			{#each templates as template, i}
				{@const isBundled = bundledTemplateMap.has(template)}
				{@const templateData = isBundled
					? bundledTemplateMap.get(template)
					: normalizeTemplate(
						safeJSONParse(localStorage.getItem(`template_${template}`), {})
					)}
				{@const graphData = safeJSONParse(templateData?.payload?.data || '{}')}

				<li class="col-span-1">
					<Card.Root>
						<Dialog.Root bind:open={dialogOpen}>
							<Card.Content class="flex flex-col gap-4 ">
								<Card.Header class="relative flex justify-between px-0">
									<Card.Title>{templateData?.description ? template : template}</Card.Title>
									{#if isBundled}
										<span class="text-muted-foreground absolute right-0 text-xs">Built-in</span>
									{:else if !templateData?.trusted}
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
									class=" bg-sidebar hover:bg-accent-foreground/10 aspect-square w-full overflow-clip rounded-lg transition-all"
									onclick={() => openTemplate(template)}
								>
									<AgentGraph
										agents={graphData?.agentGraphRequest?.agents || []}
										groups={graphData?.agentGraphRequest?.groups || []}
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
									<span class="flex gap-2">
										<Tooltip.Provider>
											<Tooltip.Root delayDuration={300}>
												<Tooltip.Trigger
													><Button
														class="self-start"
														variant="ghostHover"
														size="sm"
														href="{base}/templates/create?template=${template}"
														><IconPencilRegular />
														<div class="sr-only">Edit</div></Button
													></Tooltip.Trigger
												>
												<Tooltip.Content>
													<p>Edit</p>
												</Tooltip.Content>
											</Tooltip.Root>
										</Tooltip.Provider>

										<Tooltip.Provider>
											<Tooltip.Root delayDuration={300}>
												<Tooltip.Trigger
													><Button
														class="self-start"
														variant="ghostHover"
														size="sm"
														onclick={() => downloadTemplate(template)}
														><IconDownloadRegular />
														<div class="sr-only">Download</div></Button
													></Tooltip.Trigger
												>
												<Tooltip.Content>
													<p>Download</p>
												</Tooltip.Content>
											</Tooltip.Root>
										</Tooltip.Provider>
									</span>

									<Button onclick={() => openTemplate(template)}>View</Button>
								</Card.Footer>
							</Card.Content>
						</Dialog.Root>
					</Card.Root>
				</li>
			{/each}
		</ul>
	{:else if loading}
		<section class="m-auto flex flex-col gap-2">
			<Skeleton class="bg-muted h-4 w-42 rounded-lg" />
			<Skeleton class="bg-muted h-4 w-32 rounded-lg" />
			<Skeleton class="bg-muted h-4 w-56 rounded-lg" />
		</section>
	{:else}
		<section
			class="bg-sidebar m-auto flex max-w-md flex-col items-center gap-4 rounded-lg border p-8 text-center"
		>
			<p class="text-muted-foreground">
				No templates found. Create your first template to get started!
			</p>
		</section>
	{/if}
{/key}

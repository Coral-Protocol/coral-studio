<script lang="ts" module>
	import { Context } from 'runed';
	import type { SuperFormData } from 'sveltekit-superforms/client';
	import type { FormSchema } from './schemas';
	import type z from 'zod';

	export type SessionCreatorContext = {
		payload: CreateSessionRequest | null;
		importSession: (options: { success?: string; from: string }) => boolean;
		formData: SuperFormData<z.output<FormSchema>>;
	};

	export const createSessionContext = new Context<SessionCreatorContext>('sessionCreator');
</script>

<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import * as Resizable from '$lib/components/ui/resizable/index.js';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Select from '$lib/components/ui/select';
	import * as Menubar from '$lib/components/ui/menubar/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Form from '$lib/components/ui/form';

	import IconWrenchRegular from 'phosphor-icons-svelte/IconWrenchRegular.svelte';
	import IconTrash from 'phosphor-icons-svelte/IconTrashRegular.svelte';
	import IconUsersThreeRegular from 'phosphor-icons-svelte/IconUsersThreeRegular.svelte';
	import IconRobotRegular from 'phosphor-icons-svelte/IconRobotRegular.svelte';

	import Input from '$lib/components/ui/input/input.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Separator } from '$lib/components/ui/separator';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Toggle } from '$lib/components/ui/toggle';

	import { Spinner } from '$lib/components/ui/spinner';
	import TooltipLabel from '$lib/components/tooltip-label.svelte';
	import TwostepButton from '$lib/components/twostep-button.svelte';
	import Combobox from '$lib/components/combobox.svelte';
	import Pip from '$lib/components/pip.svelte';

	import OptionField from './OptionField.svelte';
	import SidebarTab from './SidebarTab.svelte';
	import Graph from './Graph.svelte';
	import ToolInput from './ToolInput.svelte';

	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';

	import { page } from '$app/state';
	import { onMount, tick } from 'svelte';

	import { toast } from 'svelte-sonner';
	import { PersistedState } from 'runed';

	import { cn } from '$lib/utils';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import { Session } from '$lib/session.svelte';
	import { appContext } from '$lib/context';
	import { randomAdjective, randomAnimal } from '$lib/words';
	import { registryIdOf, type RegistryAgentIdentifier } from '$lib/CoralServer.svelte';

	import { makeFormSchema, type CreateSessionRequest } from './schemas/types';
	import { toPayload } from './schemas';
	import { importFromPayload } from './schemas';
	import AgentPicker from './AgentPicker.svelte';
	import CodePane from './panes/CodePane.svelte';
	import GroupsPane from './panes/GroupsPane.svelte';

	function sourceToRegistryId(source: AgentSource): RegistryAgentIdentifier['registrySourceId'] {
		switch (source) {
			case 'local':
				return { type: 'local' };

			case 'marketplace':
				return { type: 'marketplace' };

			case 'linked':
				return { type: 'linked', linkedServerId: 'default' };
		}
	}

	const addAgent = async (name: string, source: any, version: string) => {
		try {
			const existingCount = $formData.agents.filter((a) => a.id.name === name).length;
			const registrySourceId = sourceToRegistryId(source as AgentSource);
			const detailed = await ctx.server
				.lookupAgent({ name, version, registrySourceId })
				.catch((e) => {
					toast.error(`${e}`);
					console.error(e);
					return null;
				});
			if (detailed) {
				try {
					$formData.agents.push({
						id: {
							name,
							version,
							registrySourceId
						},
						name: name + (existingCount > 0 ? `-${existingCount}` : ''),
						description: '',
						providerType: 'local',
						provider: {
							runtime: Object.keys(detailed.registryAgent.runtimes)[0] as any,
							remote_request: {
								maxCost: { type: 'micro_coral', amount: 1000 },
								serverSource: { type: 'servers', servers: [] }
							}
						},
						customToolAccess: new Set(),
						blocking: false,
						options: {}
					});
					detailedAgent = null;
					$formData.agents = $formData.agents;
					selectedAgent = $formData.agents.length - 1;
				} catch (error) {
					console.error('Failed to add agent:', error);
				}
			}
		} catch (error) {
			console.error('Failed to lookup agent:', error);
		}
	};

	const AGENT_REGEX = /^(marketplace|linked|local):(.+?)@(\d+\.\d+\.\d+)$/;

	type AgentSource = 'marketplace' | 'linked' | 'local';
	let parsedAgents: ParsedAgent[] = [];

	onMount(async () => {
		const agentsQuery = page.url.searchParams.get('agents');
		try {
			const result = parseAgentsQuery(agentsQuery);
			parsedAgents = result.agents;

			for (const agent of parsedAgents) {
				console.log(
					'following url instructions to add agent: ' +
						agent.name +
						'@' +
						agent.version +
						' from ' +
						agent.source +
						' '
				);
				await addAgent(agent.name, agent.source, agent.version);
			}
		} catch (err) {
			console.error('Failed to parse agents:', err);
		}
	});
	interface ParsedAgent {
		source: AgentSource;
		name: string;
		version: string;
		raw: string;
	}

	function parseAgentsQuery(query: string | null) {
		if (!query) return { agents: [], errors: [] as string[] };

		const agentsFromQuery: ParsedAgent[] = [];
		const errors: string[] = [];

		for (const raw of query.split(',')) {
			const trimmed = raw.trim();
			if (!trimmed) continue;

			const match = trimmed.match(AGENT_REGEX);

			if (!match) {
				errors.push(`Invalid agent format: "${trimmed}"`);
				continue;
			}

			const [, source, name, version] = match;

			agentsFromQuery.push({
				source: source as AgentSource,
				name: name ?? '',
				version: version ?? '',
				raw: trimmed
			});
		}

		return { agents: agentsFromQuery, errors };
	}

	let lastDeletedAgent: {
		agent: any;
		index: number;
	} | null = $state(null);

	const removeAgent = (index: number) => {
		if (index < 0 || index >= $formData.agents.length) return;

		const agent = $formData.agents[index];

		lastDeletedAgent = {
			agent,
			index
		};

		$formData.agents.splice(index, 1);
		$formData.agents = $formData.agents;

		// Maintain selection invariants
		if (selectedAgent !== null) {
			if (selectedAgent === index) {
				selectedAgent = 0;
			} else if (selectedAgent > index) {
				selectedAgent--;
			}
		}

		toast(`Agent "${lastDeletedAgent.agent.name}" deleted`, {
			action: {
				label: 'Undo',
				onClick: restoreAgent
			}
		});
	};

	const restoreAgent = () => {
		if (!lastDeletedAgent) return;

		$formData.agents.splice(lastDeletedAgent.index, 0, lastDeletedAgent.agent);

		$formData.agents = $formData.agents;
		toast.success('Agent "' + lastDeletedAgent.agent.name + '" restored');

		selectedAgent = lastDeletedAgent.index;

		lastDeletedAgent = null;
	};

	let ctx = appContext.get();

	let formSchema = $derived(makeFormSchema(ctx.server));

	let currentTab = $state('agent');

	let sendingForm = $state(false);

	// svelte-ignore state_referenced_locally
	let form = superForm(defaults(zod4(formSchema)), {
		SPA: true,
		dataType: 'json',
		// svelte-ignore state_referenced_locally
		validators: zod4(formSchema),
		validationMethod: 'onblur',
		resetForm: false,

		async onUpdate({ form: f }) {
			console.log('[onUpdate]', {
				form: f
			});

			if (!f.valid) {
				toast.error('Please fix all errors in the form.');
				console.error({ errors: f.errors });
				return;
			}
			try {
				sendingForm = true;
				const body = await toPayload(ctx.server, $formData);
				const res = await ctx.server.api.POST('/api/v1/local/session', {
					body
				});
				sendingForm = false;

				if (res.error) {
					// todo @alan there should probably be an api class where we can generic-ify the handling of this error
					// with a proper type implementation too..!
					let error: { message?: string; stackTrace?: string[] } = res.error;
					console.error(error.stackTrace);

					toast.error(`Failed to create session: ${error.message}`, { duration: Infinity });
					return;
				}
				if (res.data) {
					ctx.session = new Session({
						sessionId: res.data.sessionId,
						namespace: ctx.server.namespace,
						server: ctx.server
					});
				} else {
					sendingForm = false;
					throw new Error('no data received');
				}
			} catch (e) {
				console.log(e);
				toast.error(`Failed to create session: ${e}`, { duration: Infinity });
				sendingForm = false;
			}
		}
	});

	// This is a workaround for not being able to call superForm in a $derived
	$effect(() => {
		form.options.validators = zod4(formSchema);
	});

	let { form: formData, errors, allErrors, enhance } = $derived(form);

	let sessCtx = $state({
		// svelte-ignore state_referenced_locally
		formData,
		payload: null,
		importSession: ({
			success = 'Session JSON updated successfully',
			from
		}: {
			success?: string;
			from: string;
		}): boolean => {
			try {
				$formData = importFromPayload(from);
				selectedAgent = $formData.agents.length > 0 ? 0 : null;
				toast.success(success);
				return true;
			} catch (e) {
				console.error(e);
				toast.error('Failed to update session from JSON: ' + e);
				return false;
			}
		}
	}) as SessionCreatorContext;
	createSessionContext.set(sessCtx);
	$effect(() => {
		toPayload(ctx.server, $formData)
			.then((val) => (sessCtx.payload = val))
			.catch(console.error);
	});
	$effect(() => {
		sessCtx.formData = formData;
	});

	function formatMsToHHMMSS(ms: number): string {
		const totalSeconds = Math.floor(ms / 1000);
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;

		return [hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':');
	}

	const usdFormatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});

	const maxCostEstimate = $derived(
		(($formData.sessionRuntimeSettings.ttl ?? 0) * $formData.agents.length * 10) / 60000
	);

	let selectedTool: string | null = $state(null);

	let selectedAgent: number | null = $state(null);
	let curAgent = $derived(selectedAgent !== null ? $formData.agents[selectedAgent] : undefined);
	let curCatalog = $derived(
		curAgent && ctx.server.catalogs[registryIdOf(curAgent.id.registrySourceId)]
	);

	let detailedAgent = $state<Awaited<ReturnType<typeof getDetailed>> | null>(null);

	$effect(() => {
		if (curAgent) {
			getDetailed(curAgent.id).then((d) => (detailedAgent = d));
		}
	});

	const getDetailed = async (agentId: RegistryAgentIdentifier) => {
		return await ctx.server.lookupAgent(agentId).catch((e) => {
			toast.error(`${e}`);
			console.error(e);
			return null;
		});
	};

	const isMobile = new IsMobile();

	const UNGROUPED = '__ungrouped';

	let groupedOptions = $derived(
		Object.entries(detailedAgent?.registryAgent?.options ?? {}).reduce<
			Record<string, [string, any][]>
		>((acc, [name, opt]) => {
			const group = opt?.display?.group ?? UNGROUPED;
			(acc[group] ??= []).push([name, opt]);
			return acc;
		}, {})
	);

	let agentsListTabs: string = $state('table');

	$effect(() => {
		if ($formData.agents.length > 0) {
			if (currentTab === 'groups' && settings.current.enableAgentGraphView) {
				agentsListTabs = 'graph';
			} else {
				agentsListTabs = 'table';
			}
		}
	});

	type Settings = {
		enableAgentGraphView: boolean;
		columns: {
			name: boolean;
			version: boolean;
			registrySource: boolean;
			agent: boolean;
		};
	};

	const settings = new PersistedState<Settings>('appSettings', {
		enableAgentGraphView: true,
		columns: {
			name: true,
			version: true,
			registrySource: true,
			agent: true
		}
	});

	function clearSession() {
		$formData = {
			groups: [],
			tools: {},
			sessionRuntimeSettings: {
				ttl: 50000
			},
			agents: []
		};
		selectedAgent = null;
	}
</script>

<header class="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4">
	<Sidebar.Trigger class="-ml-1" />
	<Separator orientation="vertical" class="mr-2 h-4" />
	<Breadcrumb.Root class="flex-grow">
		<Breadcrumb.List>
			<Breadcrumb.Item class="hidden md:block">
				<Breadcrumb.Link>Sessions</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
			<Breadcrumb.Item class="hidden md:block">
				<Breadcrumb.Page>Create</Breadcrumb.Page>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>
</header>
<form
	method="POST"
	use:enhance
	class="flex h-full flex-col overflow-hidden"
	enctype="multipart/form-data"
>
	<Resizable.PaneGroup
		direction={isMobile.current ? 'vertical' : 'horizontal'}
		class="min-h-0 flex-1 flex-row-reverse overflow-hidden"
	>
		<Resizable.Pane defaultSize={75} minSize={25}>
			<Resizable.PaneGroup direction="vertical">
				<Resizable.Pane minSize={25} defaultSize={50}>
					<Resizable.PaneGroup direction="horizontal" class="min-h-0 flex-1 overflow-hidden">
						<Resizable.Pane
							class="relative flex min-h-0 flex-col overflow-hidden"
							minSize={25}
							defaultSize={50}
						>
							<Menubar.Root class="bg-sidebar border-0 border-b">
								<Menubar.Menu>
									<Menubar.Trigger>Session</Menubar.Trigger>
									<Menubar.Content>
										<Menubar.Item onSelect={clearSession}>Clear session</Menubar.Item>
										<Menubar.Separator />
										<Menubar.Item
											onSelect={async () => {
												sessCtx.importSession({
													from: await navigator.clipboard.readText(),
													success: 'Session updated from clipboard'
												});
											}}>Import JSON from clipboard</Menubar.Item
										>
										<Menubar.Item
											disabled={!sessCtx.payload}
											onSelect={() => (
												navigator.clipboard.writeText(
													sessCtx.payload ? JSON.stringify(sessCtx.payload, null, 4) : ''
												),
												toast.success('Session JSON copied to clipboard')
											)}>Export JSON to clipboard</Menubar.Item
										>
									</Menubar.Content>
								</Menubar.Menu>
								<Menubar.Menu>
									<Menubar.Trigger>View</Menubar.Trigger>
									<Menubar.Content>
										<Menubar.CheckboxItem bind:checked={settings.current.enableAgentGraphView}
											>Always Switch to Graph</Menubar.CheckboxItem
										>
										<Menubar.Separator />
										<Menubar.Sub>
											<Menubar.SubTrigger disabled class="opacity-50">Columns</Menubar.SubTrigger>
											<Menubar.SubContent>
												<Menubar.CheckboxItem>Name</Menubar.CheckboxItem>
												<Menubar.CheckboxItem>Version</Menubar.CheckboxItem>
												<Menubar.CheckboxItem>Registry Source</Menubar.CheckboxItem>
												<Menubar.CheckboxItem>Agent</Menubar.CheckboxItem>
											</Menubar.SubContent>
										</Menubar.Sub>
									</Menubar.Content>
								</Menubar.Menu>
								<Menubar.Menu>
									<Menubar.Trigger class="relative">
										Add agents
										{#if $formData.agents.length < 1}
											<Pip size={2} color="accent" />
										{/if}
									</Menubar.Trigger>
									<Menubar.Content>
										<AgentPicker
											server={ctx.server}
											onSelect={(agent, catalogId) => {
												addAgent(agent.name, catalogId.type, agent.versions[0]!);
											}}
										/>
									</Menubar.Content>
								</Menubar.Menu>
							</Menubar.Root>
							<Tabs.Root bind:value={agentsListTabs} class="min-h-0 flex-1 overflow-hidden">
								<Tabs.Content value="table" class="flex min-h-0 flex-1 overflow-hidden ">
									<Table.Root class="w-full">
										<Table.Header>
											<Table.Row>
												<Table.Head class="w-12"><Checkbox /></Table.Head>
												<Table.Head class="">Name</Table.Head>
												<Table.Head>Version</Table.Head>
												<Table.Head>Registry source</Table.Head>
												<Table.Head>Agent</Table.Head>
												<Table.Head class="w-24">Actions</Table.Head>
											</Table.Row>
										</Table.Header>
										<Table.Body>
											{#each $formData.agents as agent, i}
												<Table.Row class="cursor-pointer {i === selectedAgent ? 'bg-muted' : ''}">
													<Table.Cell>
														<p class="truncate font-medium"><Checkbox /></p>
													</Table.Cell>
													<Table.Cell onclick={() => (selectedAgent = i)}>
														<p class="truncate font-medium">{agent.name}</p>
													</Table.Cell>

													<Table.Cell onclick={() => (selectedAgent = i)}>
														<p class="truncate">{agent.id.version}</p>
													</Table.Cell>

													<Table.Cell onclick={() => (selectedAgent = i)}>
														<p class="truncate">{agent.id.registrySourceId.type}</p>
													</Table.Cell>

													<Table.Cell onclick={() => (selectedAgent = i)}>
														<p class="truncate">{agent.id.name}</p>
													</Table.Cell>

													<Table.Cell class="flex gap-2">
														<TwostepButton
															disabled={selectedAgent === null}
															class="hover:bg-destructive/50 my-2 grow truncate"
															onclick={() => removeAgent(i)}>Remove</TwostepButton
														>
													</Table.Cell>
												</Table.Row>
											{/each}
										</Table.Body>
									</Table.Root>
								</Tabs.Content>
								<Tabs.Content value="graph" class="flex min-h-0 flex-1 overflow-hidden ">
									{#if $formData.agents.length !== 0}
										<Graph agents={$formData.agents} groups={$formData.groups} bind:selectedAgent />
									{:else}
										<p>
											No agents added yet. Use the "Add agents" menu to add agents to your session.
										</p>
									{/if}
								</Tabs.Content>
							</Tabs.Root>
						</Resizable.Pane>
					</Resizable.PaneGroup>
				</Resizable.Pane>
				<Resizable.Handle withHandle />
				<Resizable.Pane
					class=" flex h-full min-h-0 flex-col !overflow-y-scroll"
					minSize={25}
					defaultSize={50}
				>
					<CodePane />
					<footer class="bg-sidebar flex justify-end gap-2 border-t p-4">
						<Form.Button
							disabled={sendingForm || $formData.agents.length === 0}
							class={sendingForm ? '' : 'bg-accent/80'}
						>
							{#if sendingForm}
								<Spinner />
							{/if}Run</Form.Button
						>
					</footer>
				</Resizable.Pane>
			</Resizable.PaneGroup>
		</Resizable.Pane>
		<Resizable.Handle withHandle />
		<Resizable.Pane defaultSize={50} minSize={25} class="bg-background flex min-h-0 flex-col gap-4">
			<Tabs.Root bind:value={currentTab} class="w-full grow overflow-hidden">
				<Tabs.List class="bg-sidebar flex w-full rounded-none border-b *:rounded-none">
					<SidebarTab
						value="agent"
						icon={IconRobotRegular}
						invalid={Object.values($errors?.agents ?? {}).length > 0}>Agent</SidebarTab
					>
					<SidebarTab
						value="groups"
						icon={IconUsersThreeRegular}
						invalid={Object.values($errors?.groups ?? {}).length > 0}>Groups</SidebarTab
					>
					<SidebarTab
						value="session"
						icon={IconWrenchRegular}
						invalid={Object.values($errors?.sessionRuntimeSettings ?? {}).length > 0}
						>Session</SidebarTab
					>
				</Tabs.List>
				{@const availableOptions = {}}
				{#key selectedAgent}
					<Tabs.Content value="agent" class="flex min-h-0 flex-col gap-2 overflow-y-scroll ">
						{#if selectedAgent !== null && curAgent && curCatalog}
							{#if !detailedAgent}
								<Spinner class="m-auto my-8" />
							{:else}
								<header class="flex flex-col gap-2 px-4">
									<Form.ElementField
										{form}
										name="agents[{selectedAgent}].name"
										class="flex items-center gap-2"
									>
										<Form.Control>
											{#snippet children({ props })}
												<TooltipLabel
													tooltip={'Name of the agent in this session'}
													class="m-0 max-w-1/4"
													>Name
												</TooltipLabel>
												<Input {...props} bind:value={$formData.agents[selectedAgent!]!.name} />
											{/snippet}
										</Form.Control>
									</Form.ElementField>
									<Form.ElementField
										{form}
										name="agents[{selectedAgent}].description"
										class="flex items-center gap-2"
									>
										<Form.Control>
											{#snippet children({ props })}
												<TooltipLabel tooltip={'Optional agent description'} class="m-0 max-w-1/4"
													>Description
												</TooltipLabel>
												<Input
													{...props}
													bind:value={$formData.agents[selectedAgent!]!.description}
												/>
											{/snippet}
										</Form.Control>
									</Form.ElementField>
									<Form.ElementField
										{form}
										name="agents[{selectedAgent}].id.version"
										class="flex items-center gap-2"
									>
										<Form.Control>
											{#snippet children({ props })}
												{@const id = curAgent.id}
												{@const reg = curCatalog.agents[id.name]!}

												<TooltipLabel
													tooltip={'Version to use from the server agent registry'}
													class="w m-0 max-w-1/4 truncate">Version</TooltipLabel
												>
												<Combobox
													{...props}
													class="w-auto grow pr-[2px] "
													side="right"
													align="start"
													disabled={reg.versions.length <= 1}
													bind:selected={() => id.version, () => {}}
													options={[{ items: reg.versions }]}
													searchPlaceholder="Search versions..."
													onValueChange={(value: string) => {
														$formData.agents[selectedAgent!]!.id.version = value;
														$formData.agents = $formData.agents;
														tick().then(() => {
															for (const name in $formData.agents[selectedAgent!]!.options) {
																if (!(name in availableOptions)) {
																	delete $formData.agents[selectedAgent!]!.options[name];
																}
															}
															$formData.agents = $formData.agents;
														});
													}}
												/>
											{/snippet}
										</Form.Control>
									</Form.ElementField>

									<Form.ElementField
										{form}
										name="agents[{selectedAgent}].provider.runtime"
										class="flex items-center gap-2"
									>
										<Form.Control>
											{#snippet children({ props })}
												{@const runtime = $formData.agents[selectedAgent!]!.provider.runtime}
												{@const items = Object.keys(detailedAgent?.registryAgent?.runtimes ?? {})}
												<TooltipLabel
													tooltip={'Will only show available options for the selected agent type'}
													class="m-0 max-w-1/4">Runtime</TooltipLabel
												>
												<Combobox
													{...props}
													class="w-auto grow pr-[2px]"
													side="right"
													align="start"
													disabled={items.length <= 1}
													options={[
														{
															items
														}
													]}
													searchPlaceholder="Search runtimes..."
													bind:selected={
														() =>
															runtime ||
															Object.keys(detailedAgent?.registryAgent?.runtimes ?? {})[0],
														() => {}
													}
													onValueChange={(selected: string) => {
														$formData.agents[selectedAgent!]!.provider.runtime = selected as any;
													}}
												/>
											{/snippet}
										</Form.Control>
									</Form.ElementField>
									<Form.ElementField
										{form}
										name="agents[{selectedAgent}].provider.runtime"
										class="flex items-center gap-2"
									>
										<Form.Control>
											{#snippet children({ props })}
												{@const tools = $formData.agents[selectedAgent!]!.customToolAccess}
												<TooltipLabel
													tooltip={'What custom tools this agent has access to.'}
													class="m-0 max-w-1/4">Custom Tools</TooltipLabel
												>
												<Select.Root
													{...props}
													type="multiple"
													value={Array.from(tools.keys())}
													onValueChange={(value) => {
														if (selectedAgent === null || !$formData.agents[selectedAgent]) return;
														$formData.agents[selectedAgent!]!.customToolAccess = new Set(value);
														$formData.agents = $formData.agents;
													}}
												>
													<Select.Trigger class="m-0">
														<span>{tools.size} tools</span>
													</Select.Trigger>
													<Select.Content>
														{#if Object.keys($formData.tools).length == 0}
															<span class="text-muted-foreground h-9 px-2 text-sm italic"
																>No tools</span
															>
														{/if}
														{#each Object.values($formData.tools) as tool}
															<Select.Item value={tool.id}>{tool.name}</Select.Item>
														{/each}
													</Select.Content>
												</Select.Root>
											{/snippet}
										</Form.Control>
									</Form.ElementField>
								</header>
								<ol class="border-t">
									{#each Object.entries(groupedOptions) as [group, entries]}
										<li>
											{#if group !== '__ungrouped'}
												<Accordion.Root type="multiple" value={[group]}>
													<Accordion.Item value={group}>
														<Accordion.Trigger variant="compact">
															{group}
														</Accordion.Trigger>

														<Accordion.Content class="!p-0">
															<ol>
																{#each entries as [name, opt] (name)}
																	<OptionField
																		superform={form}
																		agent={selectedAgent!}
																		{name}
																		meta={opt}
																	/>
																{/each}
															</ol>
														</Accordion.Content>
													</Accordion.Item>
												</Accordion.Root>
											{:else}
												<ol>
													{#each entries as [name, opt] (name)}
														<OptionField
															superform={form}
															agent={selectedAgent!}
															{name}
															meta={opt}
														/>
													{/each}
												</ol>
											{/if}
										</li>
									{/each}
								</ol>
							{/if}
						{:else}
							<div class="text-muted-foreground m-auto h-full w-full content-center text-center">
								Add an agent to begin.
							</div>
						{/if}
					</Tabs.Content>
				{/key}
				<Tabs.Content value="session" class="flex flex-col gap-4 ">
					<section class="flex flex-col gap-4 px-4">
						<h1 class="font-semibold">Session settings</h1>

						<Form.ElementField
							{form}
							name="sessionRuntimeSettings.ttl"
							class="flex items-center gap-2 "
						>
							<Form.Control>
								{#snippet children({ props })}
									<TooltipLabel
										title="Time to live (TTL)"
										tooltip="Measured in milliseconds, the time to live is the maximum duration a session can last"
										extra={{
											required: true,
											type: 'number'
										}}
										class="max-w-1/4 min-w-1/4"
									>
										Time to live
									</TooltipLabel>
									<Input
										{...props}
										bind:value={$formData.sessionRuntimeSettings.ttl}
										placeholder="time in milliseconds"
										maxlength={15778476000}
										type="number"
										class="grow"
									/>
								{/snippet}
							</Form.Control>
						</Form.ElementField>
						<span class="text-muted-foreground flex flex-col justify-between">
							<TooltipLabel tooltip="Based off Session time to live settings" class=" max-w-fit">
								Maximum session duration: {formatMsToHHMMSS(
									$formData.sessionRuntimeSettings.ttl ?? 0
								) ?? 'HH:MM:SS'}
							</TooltipLabel>

							<TooltipLabel
								tooltip="Maximum cost of the session, calculated by number of agents, per minute."
								class="max-w-fit"
							>
								Maximum cost of session: {usdFormatter.format((maxCostEstimate ?? 0) / 100)}
							</TooltipLabel>
						</span>
						{#if $errors?.sessionRuntimeSettings?.ttl && JSON.stringify($errors.sessionRuntimeSettings?.ttl) !== '{}' && JSON.stringify($errors.sessionRuntimeSettings?.ttl) !== '{}'}
							<span class="text-xs">
								{$errors?.sessionRuntimeSettings?.ttl}
							</span>
						{/if}
					</section>
					<Separator />
					<section class="flex flex-col gap-4 px-4">
						<h1 class="font-semibold">Custom Tools</h1>
						<Button
							onclick={() => {
								const id = crypto.randomUUID() as string;
								($formData.tools[id] = {
									id,
									name: `${randomAdjective()}-${randomAnimal()}`,
									transport: { type: 'http', url: '' },
									schema: { inputSchema: {}, outputSchema: undefined, name: undefined }
								}),
									(selectedTool = id);
							}}>+</Button
						>
						<Item.Root variant="outline" class="p-2">
							<Item.Content>
								<ScrollArea>
									{#if Object.keys($formData.tools).length == 0}
										<p
											class="text-muted-foreground flex h-9 w-full place-items-center justify-center"
										>
											No tools.
										</p>
									{/if}
									{#each Object.values($formData.tools) as tool (tool.id)}
										<Toggle
											class="flex w-full justify-start pr-0"
											bind:pressed={() => selectedTool === tool.id, () => (selectedTool = tool.id)}
										>
											<p class="grow text-left">{tool.name}</p>
											<TwostepButton
												class="size-9"
												variant="ghostDestructive"
												onclick={() => {
													delete $formData.tools[tool.id];
													$formData.tools = $formData.tools;
													selectedAgent =
														selectedAgent && Math.min(selectedAgent, $formData.agents.length - 1);
												}}><IconTrash /></TwostepButton
											>
										</Toggle>
									{/each}
								</ScrollArea>
							</Item.Content>
						</Item.Root>

						{#if selectedTool !== null}
							<ToolInput superform={form} id={selectedTool} />
						{/if}
					</section>
				</Tabs.Content>
				<Tabs.Content value="groups" class="flex flex-col">
					<GroupsPane />
				</Tabs.Content>
			</Tabs.Root>
		</Resizable.Pane>
	</Resizable.PaneGroup>
</form>

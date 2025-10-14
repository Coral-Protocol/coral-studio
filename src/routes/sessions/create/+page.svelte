<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Separator } from '$lib/components/ui/separator';
	import IconTrash from 'phosphor-icons-svelte/IconTrashRegular.svelte';
	import IconWrenchRegular from 'phosphor-icons-svelte/IconWrenchRegular.svelte';
	import IconMenu from 'phosphor-icons-svelte/IconListRegular.svelte';
	import IconPrompt from 'phosphor-icons-svelte/IconChatCircleDotsRegular.svelte';
	import IconListRegular from 'phosphor-icons-svelte/IconListRegular.svelte';
	import IconGraph from 'phosphor-icons-svelte/IconGraphRegular.svelte';
	import IconCheck from 'phosphor-icons-svelte/IconCheckRegular.svelte';
	import * as Resizable from '$lib/components/ui/resizable/index.js';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import ClipboardImportDialog from '$lib/components/dialogs/clipboard-import-dialog.svelte';
	import * as Select from '$lib/components/ui/select';

	import { Toggle } from '$lib/components/ui/toggle';
	import * as Form from '$lib/components/ui/form';
	import { Checkbox } from '$lib/components/ui/checkbox';

	import Input from '$lib/components/ui/input/input.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table/index.js';

	// TODO: change these icons
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { ClipboardCopy, PlusIcon, TrashIcon } from '@lucide/svelte';

	import { cn } from '$lib/utils';
	import { idAsKey, sessionCtx, type PublicRegistryAgent } from '$lib/threads';
	import { Session } from '$lib/session.svelte';
	import { tools } from '$lib/mcptools';

	import Combobox from '$lib/components/combobox.svelte';
	import CodeBlock from '$lib/components/code-block.svelte';
	import TooltipLabel from '$lib/components/tooltip-label.svelte';
	import TwostepButton from '$lib/components/twostep-button.svelte';
	import ModalCollapsible from '$lib/components/modal-collapsible.svelte';

	import { toast } from 'svelte-sonner';
	import { watch } from 'runed';
	import { SvelteSet } from 'svelte/reactivity';
	import { Textarea } from '$lib/components/ui/textarea';

	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import * as schemas from './schemas';

	import type { HTMLInputTypeAttribute } from 'svelte/elements';
	import createClient from 'openapi-fetch';
	import type { paths, components } from '$generated/api';
	import { onMount, tick } from 'svelte';

	import Graph from './Graph.svelte';

	type CreateSessionRequest = components['schemas']['SessionRequest'];

	/// {a?: number | undefined} -> {a: number | undefined}
	type Complete<T> = {
		[P in keyof Required<T>]: Pick<T, P> extends Required<Pick<T, P>> ? T[P] : T[P] | undefined;
	};

	const inputTypes: {
		[K in PublicRegistryAgent['options'][string]['type']]: HTMLInputTypeAttribute;
	} = {
		string: 'text',
		number: 'text',
		secret: 'password'
	};

	let sessCtx = sessionCtx.get();

	let error: string | null = $state(null);

	let registryRaw = $derived(sessCtx.registry ?? []);
	let registry = $derived(
		Object.fromEntries((sessCtx.registry ?? []).map((a) => [idAsKey(a.id), a]))
	);

	let formSchema = $derived(schemas.makeFormSchema(registry));

	// svelte-ignore state_referenced_locally
	let form = superForm(defaults(zod4(formSchema)), {
		SPA: true,
		dataType: 'json',
		// svelte-ignore state_referenced_locally
		validators: zod4(formSchema),
		async onUpdate({ form: f }) {
			if (!f.valid) {
				toast.error('Please fix all errors in the form.');
				return;
			}
			if (!sessCtx.connection) {
				throw new Error('Invalid connection to server!');
			}
			try {
				const client = createClient<paths>({
					baseUrl: `${location.protocol}//${sessCtx.connection.host}`
				});
				const res = await client.POST('/api/v1/sessions', {
					body: asJson
				});

				if (res.error) {
					// todo @alan there should probably be an api class where we can generic-ify the handling of this error
					// with a proper type implementation too..!
					let error: { message?: string; stackTrace: string[] } = res.error;
					console.error(error.stackTrace);

					toast.error(`Failed to create session: ${error.message}`);
					return;
				}
				if (res.data) {
					if (!sessCtx.sessions) sessCtx.sessions = [];
					sessCtx.sessions.push(res.data.sessionId);
					sessCtx.session = new Session({
						...sessCtx.connection,
						session: res.data.sessionId
					});
				} else {
					throw new Error('no data received');
				}
			} catch (e) {
				console.log(e);
				toast.error(`Failed to create session: ${e}`);
			}
		}
	});

	// This is a workaround for not being able to call superForm in a $derived
	$effect(() => {
		form.options.validators = zod4(formSchema);
	});

	let { form: formData, errors, enhance } = $derived(form);

	const importFromJson = (json: string) => {
		const data: CreateSessionRequest = JSON.parse(json);
		$formData = {
			groups: data.agentGraphRequest.groups ?? [],
			applicationId: data.applicationId,
			privacyKey: data.privacyKey,
			agents: data.agentGraphRequest.agents
				.filter((agent) => agent.provider.type === 'local')
				.map((agent) => ({
					id: agent.id,
					name: agent.name,
					provider: agent.provider as any, // FIXME: annoying hack since ts doesn't know we filtered for local providers
					blocking: agent.blocking ?? true,
					options: agent.options,
					customToolAccess: new Set(agent.customToolAccess)
				}))
		};
		selectedAgent = $formData.agents.length > 0 ? 0 : null;
	};

	let usedTools = $derived(
		new Set($formData.agents.flatMap((agent) => Array.from(agent.customToolAccess)))
	) as Set<keyof typeof tools>;
	let asJson: CreateSessionRequest = $derived.by(() => {
		return {
			privacyKey: $formData.privacyKey,
			applicationId: $formData.applicationId,
			sessionId: $formData.sessionId,
			agentGraphRequest: {
				agents: $formData.agents.map((agent) => {
					return {
						id: agent.id,
						name: agent.name,
						description: undefined,
						coralPlugins: [],
						provider: agent.provider,
						blocking: agent.blocking,
						options: agent.options as any, // FIXME: !!!
						systemPrompt: agent.systemPrompt,
						customToolAccess: Array.from(agent.customToolAccess)
					} satisfies Complete<
						NonNullable<CreateSessionRequest['agentGraphRequest']>['agents'][number]
					>;
				}),
				customTools: Object.fromEntries(
					Array.from(usedTools).map((tool) => {
						let toolBody = tools[tool];
						return [
							tool,
							{
								...toolBody,
								transport: {
									...toolBody.transport,
									url: `${window.location.origin}${toolBody.transport.url}`
								}
							}
						];
					})
				) as any, // FIXME: !!!
				groups: $formData.groups
			}
		} satisfies CreateSessionRequest;
	});

	let selectedAgent: number | null = $state(null);
	let accordian: string = $state('');
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
				<Breadcrumb.Link>Create</Breadcrumb.Link>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>
</header>
<form method="POST" use:enhance class="flex h-full flex-col overflow-hidden">
	<div class="flex h-1/6 w-full flex-col items-center justify-between border-b p-6">
		<h1 class="text-2xl font-semibold">Create a new session</h1>
		<section class="flex w-full justify-between gap-4">
			<section class="flex flex-col gap-2">
				<Form.Field {form} name="sessionId">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Session name</Form.Label>
							<Input {...props} bind:value={$formData.sessionId} />
						{/snippet}
					</Form.Control>
				</Form.Field>
				<section class="flex gap-2">
					<Form.Field {form} name="applicationId">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Application ID</Form.Label>
								<Input {...props} bind:value={$formData.applicationId} />
							{/snippet}
						</Form.Control>
					</Form.Field>
					<Form.Field {form} name="privacyKey">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Privacy Key</Form.Label>
								<Input {...props} type="password" bind:value={$formData.privacyKey} />
							{/snippet}
						</Form.Control>
					</Form.Field>
				</section>
			</section>

			<section class="flex h-full flex-col gap-2">
				<p class="grow text-right text-xs">
					{#if error}
						Error
					{:else if sessCtx.registry}
						{Object.keys(sessCtx.registry).length} agent configurations found
					{/if}
				</p>
				<section class="">
					<ClipboardImportDialog onImport={importFromJson}>
						{#snippet child({ props })}
							<Button {...props} variant="outline" class="w-fit">Import <ClipboardCopy /></Button>
						{/snippet}
					</ClipboardImportDialog>
					<Button variant="outline" class="w-fit">Export</Button>
					<Form.Button>Create</Form.Button>
				</section>
			</section>
		</section>
	</div>
	<Resizable.PaneGroup direction="horizontal" class="min-h-0 flex-1 overflow-hidden">
		<Resizable.Pane
			defaultSize={25}
			minSize={15}
			class="m-4 flex min-h-0 flex-col gap-4 !overflow-scroll"
		>
			<Combobox
				side="top"
				align="center"
				options={registryRaw.map((a) => ({
					label: `${a.id.name} ${a.id.version}`,
					key: idAsKey(a.id),
					value: a.id
				}))}
				searchPlaceholder="Search agents..."
				onValueChange={(id) => {
					const count = $formData.agents.filter((agent) => agent.id.name === id.name).length;
					const runtime = registry[idAsKey(id)]?.runtimes?.at(-1) ?? 'executable';
					$formData.agents.push({
						id: id,
						provider: {
							type: 'local',
							runtime: runtime !== 'function' ? runtime : 'executable'
						},
						systemPrompt: undefined,
						blocking: true,
						name: id.name + (count > 0 ? `-${count + 1}` : ''),
						options: {},
						customToolAccess: new Set()
					});
					$formData.agents = $formData.agents;
					selectedAgent = $formData.agents.length - 1;
					accordian = 'agent-editor';
				}}
			>
				{#snippet trigger({ props })}
					<Button {...props} size="icon" class="w-full gap-1 px-3">New agent<PlusIcon /></Button
					>{/snippet}
				{#snippet option({ option })}
					{option.label}
				{/snippet}
			</Combobox>
			<Accordion.Root type="single" value={accordian}>
				<Accordion.Item value="agent-editor">
					<Accordion.Trigger>Agent editor</Accordion.Trigger>
					<Accordion.Content class="b-8 min-h-0 flex-1 overflow-auto">
						{#if selectedAgent !== null && $formData.agents.length > selectedAgent}
							{@const agent = $formData.agents[selectedAgent]!}
							{@const availableOptions = agent && registry[idAsKey(agent.id)]?.options}
							<Tabs.Root value="setup" class="grow overflow-hidden">
								<Tabs.List class=" w-full">
									<Tabs.Trigger value="setup"><IconMenu class="size-6" />Setup</Tabs.Trigger>
									<Tabs.Trigger value="prompt"><IconPrompt class="size-6" />Prompt</Tabs.Trigger>
									<Tabs.Trigger value="tools"
										><IconWrenchRegular class="size-6" />Tools</Tabs.Trigger
									>
								</Tabs.List>
								<Tabs.Content value="setup" class="flex min-h-0 flex-col gap-4 overflow-scroll">
									{#if availableOptions && selectedAgent !== null && $formData.agents.length > selectedAgent}
										<Form.ElementField
											{form}
											name="agents[{selectedAgent}].name"
											class="flex items-center gap-2"
										>
											<Form.Control>
												{#snippet children({ props })}
													<TooltipLabel tooltip={'Name of the agent in this session'} class="m-0"
														>Name</TooltipLabel
													>
													<Input {...props} bind:value={$formData.agents[selectedAgent!]!.name} />
												{/snippet}
											</Form.Control>
										</Form.ElementField>
										<Form.ElementField
											{form}
											name="agents[{selectedAgent}].id.name"
											class="flex items-center gap-2"
										>
											<Form.Control>
												{#snippet children({ props })}
													{@const id = $formData.agents[selectedAgent!]!.id}
													<TooltipLabel tooltip={'Type of this agent'} class="m-0"
														>Type</TooltipLabel
													>
													<Combobox
														{...props}
														class="w-auto grow pr-[2px]"
														side="right"
														align="start"
														bind:selected={
															() => ({
																label: `${id.name} ${id.version}`,
																key: idAsKey(id),
																value: id
															}),
															() => {}
														}
														options={registryRaw.map((a) => ({
															label: `${a.id.name} ${a.id.version}`,
															key: idAsKey(a.id),
															value: a.id
														}))}
														searchPlaceholder="Search types..."
														onValueChange={(value) => {
															$formData.agents[selectedAgent!]!.id = value;
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
													<TooltipLabel tooltip={'What runtime to use for this agent.'} class="m-0"
														>Runtime</TooltipLabel
													>
													<Combobox
														{...props}
														class="w-auto grow pr-[2px]"
														side="right"
														align="start"
														options={((registry[idAsKey(agent.id)]?.runtimes as any) ?? []).map(
															(value: string) => ({
																key: value,
																label: value,
																value
															})
														)}
														searchPlaceholder="Search runtimes..."
														bind:selected={
															() => ({ key: runtime, label: runtime, value: runtime }),
															(selected) => {
																$formData.agents[selectedAgent!]!.provider.runtime = selected.value;
															}
														}
													/>
												{/snippet}
											</Form.Control>
										</Form.ElementField>
										<Separator />
										{#each Object.entries(availableOptions) as [name, opt] (name)}
											<Form.ElementField {form} name="agents[{selectedAgent}].options.{name}.value">
												<Form.Control>
													{#snippet children({ props })}
														<TooltipLabel tooltip={opt.description} class="gap-1">
															{name}
															{#if !('default' in opt) || opt.default === undefined}
																<span class="text-destructive">*</span>
															{/if}
														</TooltipLabel>
														<Input
															{...props}
															type={inputTypes[opt.type]}
															bind:value={
																() => $formData.agents[selectedAgent!]!.options[name]?.value,
																(value) => {
																	$formData.agents[selectedAgent!]!.options[name] = {
																		type: opt.type,
																		value
																	} as any; // FIXME: !!
																}
															}
															placeholder={'default' in opt ? opt.default?.toString() : undefined}
														/>
													{/snippet}
												</Form.Control>
											</Form.ElementField>
										{/each}
									{/if}
								</Tabs.Content>
								<Tabs.Content value="prompt" class="overflow-scroll">
									<Form.ElementField
										{form}
										class="flex h-full flex-col gap-2"
										name="agents[{selectedAgent}].systemPrompt"
									>
										<Form.Control>
											{#snippet children({ props })}
												<Form.Label class=" text-muted-foreground mb-0 leading-tight"
													>Additional system prompt to add to this agent.</Form.Label
												>
												<Textarea
													{...props}
													class="min-h-32 grow"
													bind:value={$formData.agents[selectedAgent!]!.systemPrompt}
												/>
											{/snippet}
										</Form.Control>
									</Form.ElementField>
								</Tabs.Content>
								<Tabs.Content value="tools">
									<Form.Fieldset {form} name="agents[{selectedAgent}].customToolAccess">
										<ul class="flex flex-col gap-2">
											{#each Object.keys(tools) as tool (tool)}
												<li class="flex gap-2">
													<Form.Control>
														{#snippet children({ props })}
															<Checkbox
																{...props}
																value={tool}
																bind:checked={
																	() =>
																		$formData.agents[selectedAgent!]?.customToolAccess?.has(tool) ??
																		false,
																	() => {}
																}
																onCheckedChange={(checked) => {
																	if (selectedAgent === null || !$formData.agents[selectedAgent])
																		return;
																	if (checked)
																		$formData.agents[selectedAgent!]!.customToolAccess.add(tool);
																	else
																		$formData.agents[selectedAgent!]!.customToolAccess.delete(tool);
																	$formData.agents = $formData.agents;
																}}
															/>
															<Form.Label>{tool}</Form.Label>
														{/snippet}
													</Form.Control>
												</li>{/each}
										</ul>
									</Form.Fieldset>
								</Tabs.Content>
							</Tabs.Root>
						{:else}
							Select an agent to begin editing.
						{/if}
					</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>
			<Accordion.Root type="single">
				<Accordion.Item value="item-1">
					<Accordion.Trigger>Groups</Accordion.Trigger>
					<Accordion.Content>
						<p class="text-muted-foreground text-sm leading-tight">
							Define a list of groups, where each agent in a group can all interact.
						</p>
						<ul class="mt-2 flex flex-col gap-1">
							{#each $formData.groups as link, i}
								<Select.Root
									type="multiple"
									value={link}
									onValueChange={(value) => {
										$formData.groups[i] = value;
										$formData.groups = $formData.groups;
									}}
								>
									<Select.Trigger>
										{#if link.length == 0}
											<span class="text-muted-foreground text-sm italic">Empty Group</span>
										{:else}
											{link.join(', ')}
										{/if}
									</Select.Trigger>
									<Select.Content>
										{#if $formData.agents.length == 0}
											<span class="text-muted-foreground px-2 text-sm italic">No agents</span>
										{/if}
										{#each new Set($formData.agents.map((agent) => agent.name)) as id}
											<Select.Item value={id}>{id}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							{/each}
							<Button
								size="icon"
								class="w-fit gap-1 px-3"
								disabled={($formData.groups.at(-1)?.length ?? 1) == 0}
								onclick={() => {
									$formData.groups = [...$formData.groups, []];
								}}>New group<PlusIcon /></Button
							>
						</ul>
					</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>
		</Resizable.Pane>
		<Resizable.Handle withHandle />
		<Resizable.Pane
			defaultSize={75}
			minSize={50}
			class="relative flex min-h-0 flex-col overflow-hidden"
		>
			<Tabs.Root value="graph" class="min-h-0 flex-1 overflow-hidden">
				<Tabs.List class=" mx-auto mt-4 flex w-fit ">
					<Tabs.Trigger value="table"><IconListRegular /> Table</Tabs.Trigger>
					<Tabs.Trigger value="graph"><IconGraph /> Graph</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="table" class="b-8 min-h-0 flex-1 overflow-auto px-8 py-4">
					<Table.Root class="w-full">
						<Table.Caption>Agents</Table.Caption>
						<Table.Header>
							<Table.Row>
								<Table.Head>Name</Table.Head>
								<Table.Head>Runtime</Table.Head>
								<Table.Head>Provider Type</Table.Head>
								<Table.Head>Agent Type</Table.Head>
								<Table.Head>Agent Version</Table.Head>
								<Table.Head class="text-right "></Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each $formData.agents as agent, i}
								<Table.Row
									onclick={() => (selectedAgent = i)}
									class="cursor-pointer {i === selectedAgent ? 'bg-muted' : ''}"
								>
									<Table.Cell class="font-medium">
										<p class="grow">{agent.name}</p>
									</Table.Cell>
									<Table.Cell>{agent.provider.runtime}</Table.Cell>
									<Table.Cell>{agent.provider.type}</Table.Cell>
									<Table.Cell>{agent.id.name}</Table.Cell>
									<Table.Cell>{agent.id.version}</Table.Cell>
									<Table.Cell>
										<TwostepButton
											variant="ghost"
											size="icon"
											onclick={() => {
												$formData.agents.splice(i, 1);
												$formData.agents = $formData.agents;
												selectedAgent =
													selectedAgent && Math.min(selectedAgent, $formData.agents.length - 1);
											}}><IconTrash /></TwostepButton
										></Table.Cell
									>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Tabs.Content>
				<Tabs.Content value="graph" class="b-8 min-h-0 flex-1 overflow-auto">
					<Graph agents={$formData.agents} groups={$formData.groups} bind:selectedAgent />
				</Tabs.Content>
			</Tabs.Root>
		</Resizable.Pane>
	</Resizable.PaneGroup>
</form>

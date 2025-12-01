<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Separator } from '$lib/components/ui/separator';
	import IconWrenchRegular from 'phosphor-icons-svelte/IconWrenchRegular.svelte';
	import IconMenu from 'phosphor-icons-svelte/IconListRegular.svelte';
	import IconPrompt from 'phosphor-icons-svelte/IconChatCircleDotsRegular.svelte';
	import IconListRegular from 'phosphor-icons-svelte/IconListRegular.svelte';
	import IconGraph from 'phosphor-icons-svelte/IconGraphRegular.svelte';
	import IconXRegular from 'phosphor-icons-svelte/IconXRegular.svelte';
	import * as Resizable from '$lib/components/ui/resizable/index.js';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import ClipboardImportDialog from '$lib/components/dialogs/clipboard-import-dialog.svelte';
	import * as Select from '$lib/components/ui/select';
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

	import * as Form from '$lib/components/ui/form';
	import { Checkbox } from '$lib/components/ui/checkbox';

	import Input from '$lib/components/ui/input/input.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table/index.js';

	import { cn } from '$lib/utils';
	import { idAsKey, sessionCtx, type PublicRegistryAgent } from '$lib/threads';
	import { Session } from '$lib/session.svelte';
	import { tools } from '$lib/mcptools';

	import Combobox from '$lib/components/combobox.svelte';
	import TooltipLabel from '$lib/components/tooltip-label.svelte';
	import TwostepButton from '$lib/components/twostep-button.svelte';

	import { toast } from 'svelte-sonner';
	import { Textarea } from '$lib/components/ui/textarea';

	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import * as schemas from './schemas';

	import type { HTMLInputTypeAttribute } from 'svelte/elements';
	import createClient from 'openapi-fetch';
	import type { paths, components } from '$generated/api';
	import { onMount, tick } from 'svelte';

	import Graph from './Graph.svelte';
	import IconCopyRegular from 'phosphor-icons-svelte/IconCopyRegular.svelte';
	import { includes } from 'zod';
	import { id } from 'zod/v4/locales';
	import type { Provider, ProviderType } from './schemas';

	type CreateSessionRequest = components['schemas']['SessionRequest'];

	/// {a?: number | undefined} -> {a: number | undefined}
	type Complete<T> = {
		[P in keyof Required<T>]: Pick<T, P> extends Required<Pick<T, P>> ? T[P] : T[P] | undefined;
	};

	const inputTypes: {
		[K in PublicRegistryAgent['options'][string]['type']]: HTMLInputTypeAttribute;
	} = {
		string: 'text',
		number: 'number',
		secret: 'password',
		blob: 'file',
		'list[blob]': 'file',
		bool: 'number',
		i8: 'number',
		'list[i8]': 'number',
		f64: 'number',
		'list[f64]': 'number',
		f32: 'number',
		'list[f32]': 'number',
		i32: 'number',
		'list[i32]': 'number',
		i64: 'number',
		'list[i64]': 'number',
		i16: 'number',
		'list[i16]': 'number',
		'list[string]': 'string',
		u8: 'number',
		'list[u8]': 'number',
		u32: 'number',
		'list[u32]': 'number',
		u64: 'number',
		'list[u64]': 'number',
		u16: 'number',
		'list[u16]': 'number'
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
		validationMethod: 'onblur',

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

	let { form: formData, errors, allErrors, enhance } = $derived(form);

	const defaultProvider = {
		runtime: 'executable',
		remote_request: {
			maxCost: { amount: 10, type: 'coral' },
			serverSource: {
				type: 'servers',
				servers: []
			}
		}
	} satisfies Provider;

	let newServerAddress: string = $state('');
	let newServerPort: string = $state('');

	const importFromJson = (json: string) => {
		const data: CreateSessionRequest = JSON.parse(json);
		$formData = {
			groups: data.agentGraphRequest.groups ?? [],
			applicationId: data.applicationId,
			privacyKey: data.privacyKey,
			agents: data.agentGraphRequest.agents.map((agent) => ({
				id: agent.id,
				name: agent.name,
				provider: {
					runtime: agent.provider.runtime,
					remote_request:
						agent.provider.type === 'remote_request'
							? {
									maxCost: agent.provider.maxCost,
									// ensure serverSource is the "servers" variant expected by the form model
									serverSource:
										agent.provider.serverSource &&
										typeof (agent.provider.serverSource as any).type === 'string' &&
										(agent.provider.serverSource as any).type === 'servers'
											? (agent.provider.serverSource as any)
											: { type: 'servers', servers: [] },
									serverScoring: agent.provider.serverScoring
								}
							: defaultProvider.remote_request
				},
				providerType: agent.provider.type,
				blocking: agent.blocking ?? true,
				options: agent.options as any,
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
						x402Budgets: [],
						provider: {
							type: agent.providerType as ProviderType,
							runtime: agent.provider.runtime,
							...(agent.providerType == 'remote_request' ? agent.provider.remote_request : {})
						} as any,
						blocking: agent.blocking,
						options: Object.fromEntries(
							Object.entries(agent.options ?? {})
								.filter(([name, opt]: [string, any]) => {
									// find the registry entry for this agent type/version
									const reg = registryRaw.find((r) => idAsKey(r.id) === idAsKey(agent.id));
									const defaultVal = reg?.options?.[name]?.default;
									// exclude options that are unset
									if (!opt || opt.value === undefined) return false;
									// include when value differs from registry default (deep compare via JSON)
									try {
										console.log(opt.value, defaultVal);

										return JSON.stringify(opt.value) !== JSON.stringify(defaultVal);
									} catch {
										// if stringify fails, conservatively include the option
										console.log('failed to stringify');
										return true;
									}
								})
								.map(([name, opt]) => [name, { type: opt.type, value: opt.value }])
						) as any,
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
	<div class="flex w-full flex-col items-center justify-between border-b p-4">
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
						Registry loaded: {Object.keys(sessCtx.registry).length} agent types found.
					{/if}
				</p>
				<section class="flex gap-2">
					<ClipboardImportDialog onImport={importFromJson} asJson={JSON.stringify(asJson, null, 2)}>
						{#snippet child({ props })}
							<Button {...props} variant="outline" class="w-fit">Edit raw</Button>
						{/snippet}
					</ClipboardImportDialog>

					<Form.Button>Create</Form.Button>
				</section>
			</section>
		</section>
	</div>
	<Resizable.PaneGroup direction="horizontal" class="min-h-0 flex-1 overflow-hidden">
		<Resizable.Pane
			defaultSize={25}
			minSize={21}
			class="m-4 flex min-h-0 flex-col gap-4 !overflow-scroll"
		>
			<section class="flex justify-between gap-2">
				<Button
					class="grow {selectedAgent !== null && $formData.agents.length > selectedAgent
						? ''
						: 'border-accent/50'}"
					onclick={() => {
						$formData.agents.push({
							id: {
								name: registryRaw[0]?.id.name ?? 'agent-name',
								version: registryRaw[0]?.id.version ?? '1.0.0'
							},
							provider: defaultProvider,
							providerType: 'local',
							systemPrompt: undefined,
							blocking: true,
							name:
								'Agent' + ($formData.agents.length > 0 ? ` ${$formData.agents.length + 1}` : ''),
							options: registryRaw[0]
								? Object.fromEntries(
										Object.entries(registryRaw[0].options).map(([name, opt]) => [
											name,
											{
												type: opt.type,
												// initialize value from default when available, otherwise undefined
												value: 'default' in opt ? (opt as any).default : undefined
											} as any
										])
									)
								: {},
							customToolAccess: new Set()
						});
						$formData.agents = $formData.agents;
						selectedAgent = $formData.agents.length - 1;
						accordian = 'agent-editor';
					}}
				>
					Add agent
				</Button>
				<TwostepButton
					disabled={selectedAgent === null}
					variant="destructive"
					class="grow"
					onclick={() => {
						if (selectedAgent === null) return;
						const idx = selectedAgent;
						$formData.agents.splice(idx, 1);
						$formData.agents = $formData.agents;
						selectedAgent = Math.min(idx, $formData.agents.length - 1);
						selectedAgent = null;
					}}>Remove agent</TwostepButton
				>
			</section>
			{#if selectedAgent !== null && $formData.agents.length !== 0}
				{@const agent = $formData.agents[selectedAgent]!}
				{@const agentProvider = agent.provider}
				{@const providerType = agent.providerType as ProviderType}

				<Accordion.Root type="single" value={accordian}>
					<Accordion.Item value="agent-editor">
						<Accordion.Trigger>Agent settings</Accordion.Trigger>
						<Accordion.Content class="b-8 min-h-0 flex-1 overflow-auto">
							{@const availableOptions = agent && registry[idAsKey(agent.id)]?.options}
							<Tabs.Root value="options" class="grow overflow-hidden">
								<Tabs.List class=" w-full">
									<Tabs.Trigger value="options"><IconMenu class="size-6" />Options</Tabs.Trigger>
									<Tabs.Trigger value="prompt"><IconPrompt class="size-6" />Prompt</Tabs.Trigger>
									<Tabs.Trigger value="tools"
										><IconWrenchRegular class="size-6" />Tools</Tabs.Trigger
									>
								</Tabs.List>

								<Tabs.Content value="options" class="flex min-h-0 flex-col gap-4 overflow-scroll">
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
										<Separator />
										{#each Object.entries(availableOptions) as [name, opt] (name)}
											<Form.ElementField {form} name="agents[{selectedAgent}].options.{name}.value">
												<Form.Control>
													{#snippet children({ props })}
														<TooltipLabel tooltip={opt.description}>
															{name}
															{#if opt.required}
																<span class="text-destructive">*</span>
															{/if}
															<span class="text-muted-foreground ml-auto text-xs">
																- {opt.type}</span
															>
														</TooltipLabel>
														{#if opt.type === 'blob'}
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
																aria-invalid={$allErrors.length > 0 &&
																	opt.required &&
																	$formData.agents[selectedAgent!]!.options[name]?.value ===
																		undefined}
																placeholder={'default' in opt ? opt.default?.toString() : undefined}
															/>
														{:else if opt.type.includes('list')}
															{@const list = Array.isArray(
																$formData.agents[selectedAgent!]!.options[name]?.value
															)
																? ($formData.agents[selectedAgent!]!.options[name]!.value as any[])
																: []}
															<ol class="flex w-full flex-col gap-1 rounded-md">
																{#each list, i}
																	<li>
																		<ButtonGroup.Root class="w-full">
																			<Input
																				type={inputTypes[opt.type]}
																				bind:value={
																					() => {
																						const optObj =
																							$formData.agents[selectedAgent!]!.options[name];
																						const arr = Array.isArray(optObj?.value)
																							? (optObj.value as any[])
																							: undefined;
																						return arr ? arr[i] : '';
																					},
																					(value) => {
																						const optObj =
																							$formData.agents[selectedAgent!]!.options[name];
																						if (!optObj || !Array.isArray(optObj.value)) {
																							// initialize as array and set the i'th element
																							$formData.agents[selectedAgent!]!.options[name] = {
																								type: opt.type,
																								value: []
																							} as any;
																						}
																						(
																							$formData.agents[selectedAgent!]!.options[name]!
																								.value as any[]
																						)[i] = value;
																						// trigger reactivity
																						$formData.agents = $formData.agents;
																					}
																				}
																			/>
																			<Button
																				variant="outline"
																				size="icon"
																				onclick={() => {
																					const optObj =
																						$formData.agents[selectedAgent!]!.options[name];
																					if (optObj && Array.isArray(optObj.value)) {
																						(optObj.value as string[]).splice(i, 1);
																						// trigger reactivity
																						$formData.agents = $formData.agents;
																					}
																				}}
																			>
																				<IconXRegular />
																			</Button>
																		</ButtonGroup.Root>
																	</li>
																{/each}
															</ol>
															<Button
																onclick={() => {
																	const optObj = $formData.agents[selectedAgent!]!.options[name];
																	if (optObj && Array.isArray(optObj.value)) {
																		(optObj.value as string[]).push('');
																	} else {
																		$formData.agents[selectedAgent!]!.options[name] = {
																			type: opt.type,
																			value: ['']
																		} as any;
																	}
																	// trigger reactivity
																	$formData.agents = $formData.agents;
																}}>Add value</Button
															>
														{:else if opt.type === 'bool'}
															<ButtonGroup.Root>
																<Button
																	class=" {$formData.agents[selectedAgent!]!.options[name]
																		?.value === true ||
																	($formData.agents[selectedAgent!]!.options[name]?.value ===
																		undefined &&
																		opt.default === true)
																		? 'bg-accent text-accent-foreground'
																		: ''}"
																	onclick={() => {
																		const optObj = $formData.agents[selectedAgent!]!.options[name];
																		if (optObj) {
																			optObj.value = true;
																		} else {
																			$formData.agents[selectedAgent!]!.options[name] = {
																				type: opt.type,
																				value: true
																			} as any;
																		}
																		$formData.agents = $formData.agents;
																	}}>True</Button
																>
																<Button
																	class=" {$formData.agents[selectedAgent!]!.options[name]
																		?.value === false ||
																	($formData.agents[selectedAgent!]!.options[name]?.value ===
																		undefined &&
																		opt.default === false)
																		? 'bg-accent text-accent-foreground'
																		: ''}"
																	onclick={() => {
																		const optObj = $formData.agents[selectedAgent!]!.options[name];
																		if (optObj) {
																			optObj.value = false;
																		} else {
																			$formData.agents[selectedAgent!]!.options[name] = {
																				type: opt.type,
																				value: false
																			} as any;
																		}
																		$formData.agents = $formData.agents;
																	}}>False</Button
																>
															</ButtonGroup.Root>
														{:else}
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
																defaultValue={opt.default}
																aria-invalid={($allErrors.length > 0 &&
																	opt.required &&
																	$formData.agents[selectedAgent!]!.options[name]?.value ===
																		undefined) ||
																$errors?.agents?.[selectedAgent!]?.options?.[name]
																	? 'true'
																	: undefined}
																placeholder={'default' in opt ? opt.default?.toString() : undefined}
															/>
														{/if}
													{/snippet}
												</Form.Control>
											</Form.ElementField>
										{/each}
									{:else}
										<p>
											No options available! This can happen if you have no agent registry, it's
											empty, or there's no server connection.
										</p>

										<p>
											Still need help? please <a class="underline" href="/helpme">click here</a>
										</p>
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
											Found {[Object.keys(tools).length]} available tools:
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
						</Accordion.Content>
					</Accordion.Item>
				</Accordion.Root>

				<Accordion.Root type="single" value="item-1">
					<Accordion.Item value="item-1">
						<Accordion.Trigger>Provider settings</Accordion.Trigger>
						<Accordion.Content class="flex min-h-0 flex-col gap-4 overflow-scroll">
							<Form.ElementField
								{form}
								name="agents[{selectedAgent}].providerType"
								class="flex items-center gap-2"
							>
								<Form.Control>
									{#snippet children({ props })}
										Provider Type
										<Select.Root
											type="single"
											bind:value={$formData.agents[selectedAgent!]!.providerType}
										>
											<Select.Trigger class="w-full"
												>{$formData.agents[selectedAgent!]!.providerType === 'local'
													? 'Local'
													: 'Remote'}</Select.Trigger
											>
											<Select.Content>
												<Select.Item value="local">Local</Select.Item>
												<Select.Item value="remote_request">Remote</Select.Item>
											</Select.Content>
										</Select.Root>
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
										<TooltipLabel
											tooltip={'Agent runtime, will only show available options for the selected agent type'}
											class="m-0">Runtime</TooltipLabel
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
							{#if selectedAgent !== null && $formData.agents.length > selectedAgent && agent.providerType === 'remote_request'}
								<Form.ElementField
									{form}
									name="agents[{selectedAgent}].provider.remote_request.maxCost.amount"
								>
									<Form.Control>
										{#snippet children({ props })}
											<TooltipLabel tooltip={'The agents max cost'}>Agent budget</TooltipLabel>
											{#if $formData.agents[selectedAgent!]!.provider.remote_request.maxCost.type === 'micro_coral'}
												<Input
													type="number"
													placeholder="0"
													min="0"
													pattern="[0-9]"
													class="grow"
													{...props}
													bind:value={
														$formData.agents[selectedAgent!]!.provider.remote_request.maxCost.amount
													}
												/>
											{:else}
												<Input
													type="number"
													placeholder="0.00"
													min="0"
													class="grow"
													{...props}
													bind:value={
														$formData.agents[selectedAgent!]!.provider.remote_request.maxCost.amount
													}
												/>
											{/if}
										{/snippet}
									</Form.Control>
								</Form.ElementField>
								<Form.ElementField
									{form}
									name="agents[{selectedAgent}].provider.remote_request.maxCost.type"
								>
									<Form.Control>
										{#snippet children({ props })}
											<TooltipLabel tooltip={'The currency of the agents max cost'}
												>Budget Currency</TooltipLabel
											>

											<Select.Root
												{...props}
												type="single"
												bind:value={
													$formData.agents[selectedAgent!]!.provider.remote_request.maxCost.type
												}
											>
												<Select.Trigger class="w-full"
													>{$formData.agents[
														selectedAgent!
													]!.provider.remote_request.maxCost.type.charAt(0).toLocaleUpperCase() +
														$formData.agents[
															selectedAgent!
														]!.provider.remote_request.maxCost.type.replace('_', ' ').slice(
															1
														)}</Select.Trigger
												>

												<Select.Content>
													<Select.Item value="usd">USD</Select.Item>
													<Select.Item value="micro_coral">Micro coral</Select.Item>
													<Select.Item value="coral">Coral</Select.Item>
												</Select.Content>
											</Select.Root>
										{/snippet}
									</Form.Control>
								</Form.ElementField>
								<TooltipLabel tooltip={'Servers to use for remote requests'} class="m-0"
									>Servers</TooltipLabel
								>
								{@const serverSource =
									$formData.agents[selectedAgent!]!.provider.remote_request.serverSource}
								{#if serverSource.type === 'servers'}
									{#each serverSource.servers as server, i}
										<p>
											{server.address}{server.port ? `:${server.port}` : ''}{server.secure
												? ' (secure)'
												: ''}
										</p>
										<div class="flex flex-col gap-1 text-sm">
											{#if server.attributes?.length}
												<div class="text-muted-foreground text-xs">
													Attributes: {JSON.stringify(server.attributes)}
												</div>
											{/if}
										</div>
									{/each}
								{/if}
								<div class="flex w-full max-w-sm items-center space-x-2">
									<Input class="grow" placeholder="127.0.0.1" bind:value={newServerAddress} />
									<Input class="w-24" placeholder="port" bind:value={newServerPort} />
									<Button
										onclick={() => {
											if (selectedAgent === null) return;
											const agentReq = $formData.agents[selectedAgent!]!.provider.remote_request;
											const addr = (newServerAddress ?? '').trim();
											const portRaw = newServerPort;
											if (!addr) {
												toast.error('Please enter an address');
												return;
											}
											const port = portRaw === '' || portRaw === undefined ? 0 : Number(portRaw);
											if (port !== undefined && Number.isNaN(port)) {
												toast.error('Invalid port');
												return;
											}

											agentReq.serverSource.servers = agentReq.serverSource.servers ?? [];
											agentReq.serverSource.servers.push({
												address: addr,
												port,
												secure: false,
												attributes: []
											});

											// trigger reactivity
											$formData.agents = $formData.agents;

											// clear inputs
											newServerAddress = '';
											newServerPort = '';
										}}
									>
										Add
									</Button>
								</div>
							{/if}
						</Accordion.Content>
					</Accordion.Item>
				</Accordion.Root>
			{/if}
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
				<Tabs.Content value="table" class="b-8 min-h-0 flex-1 overflow-auto  py-4">
					<Table.Root class="w-full">
						<Table.Header>
							<Table.Row>
								<Table.Head>Name</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Runtime</Table.Head>
								<Table.Head>Provider Type</Table.Head>
								<Table.Head>Agent Version</Table.Head>
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
									<Table.Cell class="truncate">{agent.id.name}</Table.Cell>
									<Table.Cell>{agent.provider.runtime}</Table.Cell>
									<Table.Cell>{agent.providerType}</Table.Cell>
									<Table.Cell>{agent.id.version}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Tabs.Content>
				<Tabs.Content value="graph" class=" min-h-0 flex-1 overflow-hidden ">
					{#if $formData.agents.length !== 0}
						<Graph agents={$formData.agents} groups={$formData.groups} bind:selectedAgent />
					{:else}
						<div class="m-auto h-full w-full content-center text-center">
							Add an agent to begin.
						</div>
					{/if}
				</Tabs.Content>
			</Tabs.Root>
		</Resizable.Pane>
		<Resizable.Handle withHandle />

		<Resizable.Pane
			defaultSize={25}
			minSize={21}
			class="m-4 flex min-h-0 flex-col gap-4 !overflow-scroll"
		>
			<Accordion.Root type="single" value="item-1">
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
								}}>Create group</Button
							>
						</ul>
					</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>

			<Accordion.Root type="single">
				<Accordion.Item value="item-1">
					<Accordion.Trigger>Errors</Accordion.Trigger>
					<Accordion.Content>
						{#if $allErrors.length}
							<ul>
								{#each $allErrors as error}
									<li>
										<b>{error.path}:</b>
										{error.messages.join('. ')}
									</li>
								{/each}
							</ul>
						{:else}
							No errors!
						{/if}
					</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>
		</Resizable.Pane>
	</Resizable.PaneGroup>
</form>

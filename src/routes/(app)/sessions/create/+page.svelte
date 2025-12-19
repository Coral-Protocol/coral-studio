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
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

	import * as Form from '$lib/components/ui/form';
	import { Checkbox } from '$lib/components/ui/checkbox';

	import Input from '$lib/components/ui/input/input.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table/index.js';

	import { cn } from '$lib/utils';
	import { idAsKey, type PublicRegistryAgent } from '$lib/threads';
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
	import type { paths, components, operations } from '$generated/api';
	import { onMount, tick } from 'svelte';

	import Graph from './Graph.svelte';
	import IconCopyRegular from 'phosphor-icons-svelte/IconCopyRegular.svelte';
	import { includes } from 'zod';
	import { id } from 'zod/v4/locales';
	import type { Provider, ProviderType } from './schemas';
	import { appContext } from '$lib/context';
	import { CoralServer, registryIdOf, type RegistryAgentIdentifier } from '$lib/CoralServer.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';

	type CreateSessionRequest = NonNullable<
		operations['createSession']['requestBody']
	>['content']['application/json'];

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
		i64: 'text',
		'list[i64]': 'text',
		i16: 'number',
		'list[i16]': 'number',
		'list[string]': 'string',
		u8: 'number',
		'list[u8]': 'number',
		u32: 'number',
		'list[u32]': 'number',
		u64: 'text',
		'list[u64]': 'text',
		u16: 'number',
		'list[u16]': 'number'
	};

	let ctx = appContext.get();

	let error: string | null = $state(null);

	let formSchema = $derived(schemas.makeFormSchema(ctx.server));

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
				console.error({ errors: f.errors });
				return;
			}
			try {
				const body = await asJson;
				console.log({ body });
				const res = await ctx.server.api.POST('/api/v1/sessions/{namespace}', {
					params: {
						path: { namespace: ctx.server.namespace }
					},
					body
				});

				if (res.error) {
					// todo @alan there should probably be an api class where we can generic-ify the handling of this error
					// with a proper type implementation too..!
					let error: { message?: string; stackTrace?: string[] } = res.error;
					console.error(error.stackTrace);

					toast.error(`Failed to create session: ${error.message}`);
					return;
				}
				if (res.data) {
					if (!(ctx.server.namespace in ctx.server.allSessions))
						ctx.server.allSessions[ctx.server.namespace] = [];
					ctx.server.allSessions[ctx.server.namespace]!.push(res.data.sessionId);
					ctx.session = new Session({
						session: res.data.sessionId,
						namespace: ctx.server.namespace,
						server: ctx.server
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
			sessionRuntimeSettings: {
				ttl: 50000 // FIXME: expose this in ui
			},
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

	let asJson: Promise<CreateSessionRequest> = $derived.by(async () => {
		const detailed = await Promise.all($formData.agents.map((a) => getDetailed(a.id)));
		const agents = $formData.agents.map((agent, idx) => {
			const reg = detailed[idx];
			if (!reg) throw new Error('something bad happened');

			return {
				id: agent.id,
				name: agent.name,
				description: undefined,

				provider: {
					type: agent.providerType as ProviderType,
					runtime: agent.provider.runtime,
					...(agent.providerType == 'remote_request' ? agent.provider.remote_request : {})
				} as any,

				blocking: agent.blocking,
				systemPrompt: agent.systemPrompt,
				customToolAccess: Array.from(agent.customToolAccess),
				plugins: [],
				x402Budgets: [],
				options: Object.fromEntries(
					Object.entries(agent.options ?? {})
						.filter(([name, opt]: [string, any]) => {
							// find the registry entry for this agent type/version
							const defaultVal = reg.registryAgent.options[name]?.default;
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
				) as any
			} satisfies components['schemas']['GraphAgentRequest'];
		});

		const customTools = Object.fromEntries(
			Array.from(usedTools).map((tool) => {
				const toolBody = tools[tool];

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
		) as any;

		return {
			agentGraphRequest: {
				agents,
				groups: $formData.groups,
				customTools
			},
			sessionRuntimeSettings: {
				ttl: 50000,
				holdForTtl: true
			}
		} satisfies CreateSessionRequest;
	});

	let selectedAgent: number | null = $state(null);
	let curAgent = $derived(selectedAgent !== null ? $formData.agents[selectedAgent] : undefined);
	let curCatalog = $derived(
		curAgent && ctx.server.catalogs[registryIdOf(curAgent.id.registrySourceId)]
	);

	let detailedRegistry: {
		[catalog: string]: { [id: string]: Awaited<ReturnType<CoralServer['lookupAgent']>> };
	} = {};
	const getDetailed = async (agentId: RegistryAgentIdentifier) => {
		const catId = registryIdOf(agentId.registrySourceId);
		if (!(catId in detailedRegistry)) {
			detailedRegistry[catId] = {};
		}
		const agentKey = `${agentId.name}/${agentId.version}`;
		if (!(agentKey in detailedRegistry[catId]!)) {
			const res = await ctx.server.lookupAgent(agentId).catch((e) => {
				toast.error(`${e}`);
				console.error(e);
				return {} as any;
			});

			detailedRegistry[catId]![agentKey] = res;
		}
		// Safety: must exist because of above guards
		return detailedRegistry[catId]![agentKey]!;
	};

	let isMobile = $state(false);

	const updateIsMobile = () => {
		isMobile = window.innerWidth < 768; // Tailwind "md" breakpoint
	};

	onMount(() => {
		updateIsMobile();
		window.addEventListener('resize', updateIsMobile);
		return () => window.removeEventListener('resize', updateIsMobile);
	});

	const addAgent = () => {
		const catalog = Object.values(ctx.server.catalogs).at(0);
		const agent = catalog && Object.values(catalog.agents).at(0);

		try {
			if (!agent) {
				throw new Error('No agents found in registry');
			}

			if (!catalog) {
				throw new Error('Catalog failed to load');
			}

			if (!agent.versions?.[0]) {
				throw new Error('Agent versions are missing');
			}

			if (!Array.isArray(agent.versions) || agent.versions.length === 0) {
				throw new Error('Agent has no available versions');
			}

			const existingCount = $formData.agents.filter((a) => a.id.name === agent.name).length;

			$formData.agents.push({
				id: {
					name: agent.name,
					version: agent.versions[0],
					registrySourceId: { ...catalog.identifier }
				},
				name: agent.name + (existingCount > 0 ? `-${existingCount}` : ''),
				provider: {
					remote_request: {
						maxCost: { type: 'micro_coral', amount: 1000 },
						serverSource: { type: 'servers', servers: [] }
					},
					runtime: 'executable'
				},
				providerType: 'local',
				customToolAccess: new Set(),
				blocking: false,
				options: {}
			});

			$formData.agents = $formData.agents;
			selectedAgent = $formData.agents.length - 1;
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An unexpected error occurred';
			toast.error(message);
		}
	};

	let lastDeletedAgent: {
		agent: any;
		index: number;
	} | null = $state(null);

	const removeAgent = () => {
		if (selectedAgent === null) return;

		const index = selectedAgent;
		const agent = $formData.agents[index];

		lastDeletedAgent = {
			agent,
			index
		};

		$formData.agents.splice(index, 1);
		$formData.agents = $formData.agents;

		selectedAgent = null;

		toast('Agent "' + lastDeletedAgent.agent.name + '" deleted', {
			action: {
				label: 'Undo',
				onClick: () => restoreAgent()
			}
		});
	};

	const restoreAgent = () => {
		if (!lastDeletedAgent) return;
		console.log('aaa');

		$formData.agents.splice(lastDeletedAgent.index, 0, lastDeletedAgent.agent);

		$formData.agents = $formData.agents;
		toast.success('Agent "' + lastDeletedAgent.agent.name + '" restored');

		lastDeletedAgent = null;
	};

	$inspect(lastDeletedAgent);
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
	<div class="flex w-full items-center justify-between gap-4 border-b p-4">
		<section class="flex justify-between gap-2">
			<ClipboardImportDialog onImport={importFromJson} {asJson}>
				{#snippet child({ props })}
					<Button {...props} variant="outline" class="w-fit">Edit JSON</Button>
				{/snippet}
			</ClipboardImportDialog>

			<Select.Root type="single">
				<Select.Trigger class="!text-foreground w-[180px]" disabled={$formData.agents.length === 0}
					>{selectedAgent != null
						? ($formData.agents[selectedAgent]?.name ?? 'Select an agent')
						: 'Select an agent'}</Select.Trigger
				>
				<Select.Content>
					{#each $formData.agents as agent, i}
						<Select.Item value={agent.name} onclick={() => (selectedAgent = i)}
							>{agent.name}</Select.Item
						>
					{/each}
				</Select.Content>
			</Select.Root>
			<Button
				class="grow {selectedAgent !== null && $formData.agents.length > selectedAgent
					? ''
					: 'border-accent/50'} w-fit truncate "
				onclick={addAgent}
			>
				<span>Add <span class="hidden lg:inline">agent</span></span>
			</Button>
			<TwostepButton
				disabled={selectedAgent === null}
				variant="destructive"
				class="grow truncate"
				onclick={removeAgent}>Remove <span class="hidden xl:inline">agent</span></TwostepButton
			>
		</section>

		<Form.Button>Create Session</Form.Button>
	</div>
	<Resizable.PaneGroup
		direction={isMobile ? 'vertical' : 'horizontal'}
		class="min-h-0 flex-1 overflow-hidden"
	>
		<Resizable.Pane
			defaultSize={25}
			minSize={21}
			class="bg-card flex min-h-0 flex-col gap-4 !overflow-scroll"
		>
			{#if selectedAgent !== null && curAgent && curCatalog}
				{@const agent = curAgent}

				<!--{@const availableOptions = agent && registry[idAsKey(agent.id)]?.options}-->
				{@const availableOptions = {}}
				<Tabs.Root value="options" class="w-full grow overflow-hidden">
					<Tabs.List class="flex w-full rounded-none border-0 *:rounded-none">
						<Tabs.Trigger value="options" class="items-centertruncate flex">
							<IconMenu class="m-auto size-6 xl:hidden xl:size-0 " />
							<span class=" m-auto hidden xl:inline">Options</span>
						</Tabs.Trigger>

						<Tabs.Trigger value="prompt" class="flex items-center truncate">
							<IconPrompt class="m-auto size-6 xl:hidden xl:size-0 " />
							<span class=" m-auto hidden xl:inline">Prompt</span>
						</Tabs.Trigger>

						<Tabs.Trigger value="tools" class="flex items-center truncate">
							<IconWrenchRegular class="m-auto size-6 xl:hidden xl:size-0 " />
							<span class=" m-auto hidden xl:inline">Tools</span>
						</Tabs.Trigger>

						<Tabs.Trigger value="provider" class="flex items-center truncate">
							<IconWrenchRegular class="m-auto size-6 xl:hidden xl:size-0 " />
							<span class=" m-auto hidden xl:inline">Provider</span>
						</Tabs.Trigger>
					</Tabs.List>

					<Tabs.Content value="options" class="flex min-h-0 flex-col gap-4 overflow-scroll ">
						{#await getDetailed(curAgent.id)}
							<Skeleton />
						{:then detailed}
							<Form.ElementField
								{form}
								name="agents[{selectedAgent}].name"
								class="flex items-center gap-2  px-4"
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
							<span class="flex w-full gap-1 px-4">
								<Form.ElementField
									{form}
									name="agents[{selectedAgent}].id.name"
									class="flex grow items-center gap-2"
								>
									<Form.Control>
										{#snippet children({ props })}
											{@const id = $formData.agents[selectedAgent!]!.id}
											<TooltipLabel tooltip={'Type of this agent'} class="m-0"
												>Registry Type</TooltipLabel
											>
											<Combobox
												{...props}
												class="w-auto grow pr-[2px]"
												side="right"
												align="start"
												bind:selected={
													() => ({
														label: `${id.name}`,
														key: `${registryIdOf(id.registrySourceId)}/${id.name}`,
														value: id
													}),
													() => {}
												}
												options={Object.values(ctx.server.catalogs).map((catalog) => ({
													heading: catalog.identifier.type,
													items: Object.values(catalog.agents).map((a) => ({
														label: `${a.name}`,
														key: `${registryIdOf(catalog.identifier)}/${a.name}`,
														value: {
															registrySourceId: catalog.identifier,
															name: a.name,
															version: a.versions.at(-1)! // won't be in registry if 0 versions
														}
													}))
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
									name="agents[{selectedAgent}].id.version"
									class="flex items-center gap-2"
								>
									<Form.Control>
										{#snippet children({ props })}
											{@const id = curAgent.id}
											{@const reg = curCatalog.agents[id.name]!}

											<Combobox
												{...props}
												class="w-auto grow pr-[2px]"
												side="right"
												align="start"
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
							</span>
							<ol class="border-t">
								{#each Object.entries(detailed.registryAgent.options) as [name, opt] (name)}
									<li class="hover:bg-muted/50 border-b p-2">
										<Form.ElementField
											class="flex gap-2"
											{form}
											name="agents[{selectedAgent}].options.{name}.value"
										>
											<Form.Control>
												{#snippet children({ props })}
													<TooltipLabel
														class="relative inline w-full max-w-1/4 min-w-1/4 cursor-help content-center truncate hover:max-w-fit {opt.required
															? 'hover:pr-[0.5em]'
															: ''}"
														title={name}
														tooltip={opt.description ?? 'No description found'}
														type={opt.type}
														required={opt.required}
													>
														{name}
														{#if opt.required}
															<span class="text-accent absolute top-1 right-0 select-none">*</span>
														{/if}
													</TooltipLabel>
													{#if opt.type === 'blob'}
														<Input
															{...props}
															class="m-0"
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
															<li>
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
																	}}
																	class="m-0 w-full">Add value</Button
																>
															</li>
															{#each list, i}
																<li>
																	<ButtonGroup.Root class="m-0 w-full">
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
																			class="m-0"
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
													{:else if opt.type === 'bool'}
														<ButtonGroup.Root class="m-0 justify-start">
															<Button
																class=" {$formData.agents[selectedAgent!]!.options[name]?.value ===
																	true ||
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
																class=" {$formData.agents[selectedAgent!]!.options[name]?.value ===
																	false ||
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
															class="m-0 "
															defaultValue={opt.default}
															aria-invalid={(() => {
																const error = $errors?.agents?.[selectedAgent!]?.options?.[name];
																if (error && JSON.stringify(error).includes('{}')) return undefined;
																else if (error) return true;
																else return undefined;
															})()}
															placeholder={'default' in opt ? opt.default?.toString() : undefined}
														/>
													{/if}
												{/snippet}
											</Form.Control>
										</Form.ElementField>
										{#if JSON.stringify($errors?.agents?.[selectedAgent!]?.options?.[name]) !== '{}' && JSON.stringify($errors?.agents?.[selectedAgent!]?.options?.[name])}
											<span class="text-xs">
												{$errors?.agents?.[selectedAgent!]?.options?.[name]?.value
													? $errors?.agents?.[selectedAgent!]?.options?.[name]?.value
													: $errors?.agents?.[selectedAgent!]?.options?.[name]}
											</span>
										{/if}
									</li>
								{/each}
							</ol>
						{/await}
					</Tabs.Content>
					<Tabs.Content value="prompt" class="overflow-scroll p-4">
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
					<Tabs.Content value="tools" class="p-4">
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
														if (selectedAgent === null || !$formData.agents[selectedAgent]) return;
														if (checked)
															$formData.agents[selectedAgent!]!.customToolAccess.add(tool);
														else $formData.agents[selectedAgent!]!.customToolAccess.delete(tool);
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
					<Tabs.Content value="provider" class="flex flex-col gap-4 p-4">
						{#await getDetailed(curAgent.id)}
							<Skeleton />
						{:then detailed}
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
											options={[
												{
													items: Object.keys(detailed.registryAgent.runtimes)
												}
											]}
											searchPlaceholder="Search runtimes..."
											bind:selected={() => runtime, () => {}}
											onValueChange={(selected: string) => {
												$formData.agents[selectedAgent!]!.provider.runtime = selected as any;
											}}
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
						{/await}
					</Tabs.Content>
				</Tabs.Root>
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
						<header class="flex gap-2">
							<p class="text-muted-foreground leading-tight">
								Agents require a shared group to communicate with each other.
							</p>

							{#if ($formData.groups.at(-1)?.length ?? 1) == 0}
								<Tooltip.Provider>
									<Tooltip.Root delayDuration={100}>
										<Tooltip.Trigger
											><Button
												size="icon"
												class="w-fit gap-1 px-3"
												disabled={($formData.groups.at(-1)?.length ?? 1) == 0}
												onclick={() => {
													$formData.groups = [...$formData.groups, []];
												}}>Create a new group</Button
											></Tooltip.Trigger
										>
										<Tooltip.Content>
											Empty group already exists, please add agents to it before creating another.
										</Tooltip.Content>
									</Tooltip.Root>
								</Tooltip.Provider>
							{:else}
								<Button
									size="icon"
									class="w-fit gap-1 px-3"
									onclick={() => {
										$formData.groups = [...$formData.groups, []];
									}}>Create a new group</Button
								>
							{/if}
						</header>
						<ul class="mt-2 flex flex-col gap-1">
							{#each $formData.groups as link, i}
								<Accordion.Root type="single">
									<Accordion.Item value="item-1">
										<Accordion.Trigger>
											<span
												>Group {i + 1}
												<span class="text-muted-foreground pl-2 text-sm">{link.length} members</span
												></span
											>
										</Accordion.Trigger>
										<Accordion.Content>
											<Select.Root
												type="multiple"
												value={link}
												onValueChange={(value) => {
													$formData.groups[i] = value;
													$formData.groups = $formData.groups;
												}}
											>
												<Select.Trigger>
													<span>Invite agents</span>
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
											<ol>
												{#each link as agentName, j}
													<li>{agentName}</li>
												{/each}
											</ol>
										</Accordion.Content>
									</Accordion.Item>
								</Accordion.Root>
							{/each}
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

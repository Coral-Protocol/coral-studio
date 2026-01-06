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
	import * as Card from '$lib/components/ui/card/index.js';

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
	import Codeblock from '$lib/components/Codeblock.svelte';

	import { toast } from 'svelte-sonner';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Dialog from '$lib/components/ui/dialog/index.js';

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
	import { Spinner } from '$lib/components/ui/spinner';

	// import hljs from 'highlight.js/lib/core';
	// import javascript from 'highlight.js/lib/languages/javascript';
	// import json from 'highlight.js/lib/languages/json';

	// hljs.registerLanguage('javascript', javascript);
	// hljs.registerLanguage('json', json);

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

		onSubmit(event) {
			console.log('[onSubmit]', {
				action: event.action,
				formData: event.formData,
				submitter: event.submitter
			});
		},

		onResult(event) {
			console.log('[onResult]', {
				result: event.result
			});
		},

		onUpdated(event) {
			console.log('[onUpdated]', {
				form: event.form
			});
		},

		onError(event) {
			console.log('[onError]', {
				result: event.result
			});
		},

		onChange(event) {
			console.log('[onChange]', {
				target: event.target ?? null,
				paths: event.paths
			});
		},

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
				const body = await asJson;
				// console.log({ body });
				const res = await ctx.server.api.POST('/api/v1/sessions/{namespace}', {
					params: {
						path: { namespace: ctx.server.namespace }
					},
					body
				});
				sendingForm = false;

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
						ctx.server.allSessions[ctx.server.namespace] = {};
					// TODO @alan: replace with websocket notifications
					ctx.server.allSessions[ctx.server.namespace]![res.data.sessionId] = {
						sessionId: res.data.sessionId,
						state: 'open'
					};
					ctx.session = new Session({
						sessionId: res.data.sessionId,
						namespace: ctx.server.namespace,
						server: ctx.server
					});
				} else {
					throw new Error('no data received');
					sendingForm = false;
				}
			} catch (e) {
				console.log(e);
				toast.error(`Failed to create session: ${e}`);
				sendingForm = false;
			}
		}
	});

	// This is a workaround for not being able to call superForm in a $derived
	$effect(() => {
		form.options.validators = zod4(formSchema);
	});

	let { form: formData, errors, allErrors, enhance } = $derived(form);

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
				ttl: data.sessionRuntimeSettings?.ttl ?? 50000
			},
			agents: data.agentGraphRequest.agents.map((agent) => ({
				id: agent.id,
				name: agent.name,
				description: agent.description ?? '',
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
				description: agent.description,
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
							const defaultVal = reg.registryAgent.options[name]?.default;
							if (!opt || opt.value === undefined) return false;
							try {
								// console.log(opt.value, defaultVal);

								return JSON.stringify(opt.value) !== JSON.stringify(defaultVal);
							} catch {
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
				ttl: $formData.sessionRuntimeSettings.ttl
			}
		} satisfies CreateSessionRequest;
	});

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

	let isMobile = $state(false);

	const updateIsMobile = () => {
		isMobile = window.innerWidth < 768; // Tailwind "md" breakpoint
	};

	onMount(() => {
		updateIsMobile();
		window.addEventListener('resize', updateIsMobile);
		return () => window.removeEventListener('resize', updateIsMobile);
	});

	const addAgent = (agent: any) => {
		const catalog = Object.values(ctx.server.catalogs).at(0);
		const agentFromCatalog = catalog && Object.values(catalog.agents).at(0);

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
				description: '',
				provider: {
					remote_request: {
						maxCost: { type: 'micro_coral', amount: 1000 },
						serverSource: { type: 'servers', servers: [] }
					},
					runtime: (Object.keys(detailedAgent?.registryAgent?.runtimes ?? {})[0] ??
						undefined) as any
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

		$formData.agents.splice(lastDeletedAgent.index, 0, lastDeletedAgent.agent);

		$formData.agents = $formData.agents;
		toast.success('Agent "' + lastDeletedAgent.agent.name + '" restored');

		lastDeletedAgent = null;
	};

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
			if (currentTab === 'groups') {
				agentsListTabs = 'graph';
			} else {
				agentsListTabs = 'table';
			}
		}
	});

	import CodeMirror from 'svelte-codemirror-editor';
	import { javascript } from '@codemirror/lang-javascript';
	import { json } from '@codemirror/lang-json';
	import { dracula, draculaInit } from '@uiw/codemirror-theme-dracula';

	function toJsObjectLiteral(value: unknown, indent = 2): string {
		return (
			JSON.stringify(value, null, indent)
				// unquote valid JS identifiers
				.replace(/"([a-zA-Z_$][\w$]*)":/g, '$1:')
				// single quotes for strings (optional, stylistic)
				.replace(/"/g, "'")
		);
	}

	let jsonExample = $state<string>('');
	let fetchExample = $state<string>('');
	$effect(() => {
		let cancelled = false;

		(async () => {
			try {
				const body = await asJson;
				if (cancelled) return;

				jsonExample = JSON.stringify(body, null, 2);

				const jsBody = toJsObjectLiteral(body, 4);

				fetchExample = [
					"fetch('http://localhost:5555/api/v1/sessions/{namespace}', {",
					"  method: 'POST',",
					'  headers: {',
					"    'Content-Type': 'application/json',",
					"    Authorization: 'Bearer YOUR_SECRET_TOKEN'",
					'  },',
					'  body: JSON.stringify(',
					jsBody.replace(/^/gm, '    '),
					'  )',
					'});'
				].join('\n');
			} catch (e) {
				jsonExample = '// Failed to generate JSON example';
				fetchExample = '// Failed to generate JavaScript example';
				console.error(e);
			}
		})();

		return () => {
			cancelled = true;
		};
	});
</script>

{#snippet optionRow(name: any, opt: any)}
	<li class="hover:bg-muted/50 border-b px-4 py-2">
		<Form.ElementField
			class="flex gap-2"
			{form}
			name="agents[{selectedAgent!}].options.{name}.value"
		>
			<Form.Control>
				{#snippet children({ props })}
					<TooltipLabel
						class="max-w-1/4 min-w-1/4 {opt.required ? 'hover:pr-[0.5em]' : ''}"
						title={name}
						tooltip={opt?.display?.description ?? 'No description provided.'}
						extra={{
							required: opt.required,
							type: opt.type
						}}
					>
						{opt?.display?.label ?? name}
					</TooltipLabel>

					{#if opt.type === 'blob'}
						<Input
							{...props}
							class="m-0"
							type={inputTypes[opt.type as keyof typeof inputTypes]}
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
								$formData.agents[selectedAgent!]!.options[name]?.value === undefined}
							placeholder={'default' in opt ? opt.default?.toString() : undefined}
						/>
					{:else if opt.type.includes('list')}
						{@const list = Array.isArray($formData.agents[selectedAgent!]!.options[name]?.value)
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
										$formData.agents = $formData.agents;
									}}
									class="m-0 w-full">Add value</Button
								>
							</li>
							{#each list, i}
								<li>
									<ButtonGroup.Root class="m-0 w-full">
										<Input
											type={opt.secret
												? 'password'
												: inputTypes[opt.type as keyof typeof inputTypes]}
											bind:value={
												() => {
													const optObj = $formData.agents[selectedAgent!]!.options[name];
													const arr = Array.isArray(optObj?.value)
														? (optObj.value as any[])
														: undefined;
													return arr ? arr[i] : '';
												},
												(value) => {
													const optObj = $formData.agents[selectedAgent!]!.options[name];
													if (!optObj || !Array.isArray(optObj.value)) {
														// initialize as array and set the i'th element
														$formData.agents[selectedAgent!]!.options[name] = {
															type: opt.type,
															value: []
														} as any;
													}
													($formData.agents[selectedAgent!]!.options[name]!.value as any[])[i] =
														value;
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
												const optObj = $formData.agents[selectedAgent!]!.options[name];
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
								class=" {$formData.agents[selectedAgent!]!.options[name]?.value === true ||
								($formData.agents[selectedAgent!]!.options[name]?.value === undefined &&
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
								class=" {$formData.agents[selectedAgent!]!.options[name]?.value === false ||
								($formData.agents[selectedAgent!]!.options[name]?.value === undefined &&
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
					{:else if opt?.display?.multiline === true}
						<Textarea
							{...props}
							class="relative m-0 h-42 resize-none"
							bind:value={
								() => {
									const v = $formData.agents[selectedAgent!]!.options[name]?.value;
									return typeof v === 'string' || typeof v === 'number' ? String(v) : '';
								},
								(value) => {
									$formData.agents[selectedAgent!]!.options[name] = {
										type: opt.type,
										value
									} as any;
								}
							}
							defaultValue={opt.default}
							aria-invalid={(() => {
								const error = $errors?.agents?.[selectedAgent!]?.options?.[name];
								if (error && JSON.stringify(error).includes('{}')) return undefined;
								else if (error) return true;
								else return undefined;
							})()}
							placeholder={'default' in opt ? opt.default?.toString() : undefined}
						/>
					{:else}
						<Input
							{...props}
							type={opt.secret ? 'password' : inputTypes[opt.type as keyof typeof inputTypes]}
							bind:value={
								() => $formData.agents[selectedAgent!]!.options[name]?.value,
								(value) => {
									$formData.agents[selectedAgent!]!.options[name] = {
										type: opt.type,
										value
									} as any; // FIXME: !!
								}
							}
							class="m-0 w-full "
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
				{$errors?.agents?.[selectedAgent!]?.options?.[name]?.value ??
					$errors?.agents?.[selectedAgent!]?.options?.[name]}
			</span>
		{/if}
	</li>
{/snippet}

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
		direction={isMobile ? 'vertical' : 'horizontal'}
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
							<Tabs.Root bind:value={agentsListTabs} class="min-h-0 flex-1 overflow-hidden">
								<Tabs.Content value="table" class="flex min-h-0 flex-1 overflow-hidden ">
									<Table.Root class="w-full">
										<Table.Header>
											<Table.Row>
												<Table.Head>Name</Table.Head>
												<Table.Head>Version</Table.Head>
												<Table.Head>Registry source</Table.Head>
												<Table.Head>Agent</Table.Head>
											</Table.Row>
										</Table.Header>
										<Table.Body>
											{#each $formData.agents as agent, i}
												<Table.Row
													onclick={() => (selectedAgent = i)}
													class="cursor-pointer {i === selectedAgent ? 'bg-muted' : ''}"
												>
													<Table.Cell class="max-w-[100px]">
														<p class="truncate font-medium">{agent.name}</p>
													</Table.Cell>

													<Table.Cell class="max-w-[10px]">
														<p class="truncate">{agent.id.version}</p>
													</Table.Cell>

													<Table.Cell class="max-w-[120px]">
														<p class="truncate">{agent.id.registrySourceId.type}</p>
													</Table.Cell>

													<Table.Cell class="max-w-[240px]">
														<p class="truncate">{agent.id.name}</p>
													</Table.Cell>

													<Table.Cell>
														<TwostepButton
															disabled={selectedAgent === null}
															variant="destructive"
															size="sm"
															class="grow truncate"
															onclick={removeAgent}>Remove</TwostepButton
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
										<Card.Root class="m-auto w-1/4">
											<Card.Header>
												<Card.Title>Session creator</Card.Title>
											</Card.Header>
											<Card.Content class="flex flex-col gap-2 text-sm ">
												<span>Sessions let agents coordinate.</span>

												<span>Agents appear as nodes in a graph.</span>

												<span>Connections represent agent groups.</span>
											</Card.Content>
											<Card.Footer>
												<Button
													class="grow {selectedAgent !== null &&
													$formData.agents.length > selectedAgent
														? ''
														: 'bg-accent/90'} w-fit truncate "
													onclick={addAgent}
												>
													<span>Add an agent</span>
												</Button>
											</Card.Footer>
										</Card.Root>
									{/if}
								</Tabs.Content>
							</Tabs.Root>
						</Resizable.Pane>
						<Resizable.Handle />

						<Resizable.Pane class="bg-card flex min-h-0 flex-col" minSize={5} defaultSize={15}>
							<h2 class="mx-auto py-4">Available Agents</h2>

							{#each Object.values(ctx.server.catalogs).map((catalog) => catalog) as catalog}
								<ol class="border-t">
									{#each Object.values(ctx.server.catalogs).flatMap( (catalog) => Object.values(catalog.agents) ) as agent}
										<li class="hover:bg-sidebar grid w-full grid-cols-4 gap-2 border-b px-4 py-2">
											<Dialog.Root>
												<Dialog.Trigger
													type="button"
													class="{buttonVariants({
														variant: 'default',
														size: 'sm'
													})} col-span-3 w-full grow cursor-help justify-start truncate overflow-hidden text-xs"
													>{agent.name}</Dialog.Trigger
												>
												<Dialog.Content>
													<Dialog.Header>
														<Dialog.Title>{agent.name}</Dialog.Title>
														<Dialog.Description>
															{#await ctx.server.lookupAgent( { name: agent.name, version: agent.versions[0]!, registrySourceId: catalog.identifier } )}
																<Skeleton class="h-4 w-full" />
															{:then details}
																{details.registryAgent.info.description}
															{/await}
														</Dialog.Description>
													</Dialog.Header>
												</Dialog.Content>
											</Dialog.Root>
											<Button
												class="col-span-1 w-full grow  truncate overflow-hidden text-xs "
												size="sm"
												onclick={() => addAgent(agent)}>Add</Button
											>
										</li>
									{/each}
								</ol>
							{/each}
						</Resizable.Pane>
					</Resizable.PaneGroup>
				</Resizable.Pane>
				<Resizable.Handle />
				<Resizable.Pane
					class=" flex h-full min-h-0 flex-col !overflow-y-scroll"
					minSize={25}
					defaultSize={50}
				>
					<Tabs.Root value="json" class="grow gap-0 overflow-hidden">
						<Tabs.List
							class="bg-sidebar flex w-full justify-start rounded-none border-0 *:rounded-none"
						>
							<Tabs.Trigger value="json" class="grow-0">JSON</Tabs.Trigger>
							<Tabs.Trigger value="js" class="grow-0">Javascript</Tabs.Trigger>
						</Tabs.List>
						<Tabs.Content value="json" class="overflow-y-auto">
							<CodeMirror
								bind:value={jsonExample}
								lang={json()}
								theme={dracula}
								readonly
								class="ͼo h-full"
							/>
						</Tabs.Content>
						<Tabs.Content value="js" class="overflow-y-auto">
							<CodeMirror
								bind:value={fetchExample}
								lang={javascript()}
								theme={dracula}
								readonly
								class="ͼo h-full"
							/>
						</Tabs.Content>
					</Tabs.Root>
					<footer class="bg-sidebar flex justify-end gap-2 border-t p-4">
						<!-- <Button
							disabled={sendingForm || $formData.agents.length === 0}
							onclick={() => importFromJson(jsonExample)}>Save JSON Changes</Button
						>

						<Button
							disabled={sendingForm || $formData.agents.length === 0}
							onclick={() => {
								navigator.clipboard.writeText(jsonExample);
								toast.success('Session JSON copied to clipboard');
							}}>Copy JSON</Button
						> -->

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
		<Resizable.Handle />
		<Resizable.Pane defaultSize={50} minSize={25} class="bg-card flex min-h-0 flex-col gap-4">
			<Tabs.Root bind:value={currentTab} class="w-full grow overflow-hidden">
				<Tabs.List class="flex w-full rounded-none border-0 *:rounded-none">
					<Tabs.Trigger value="agent" class="flex items-center truncate">
						<IconMenu class="m-auto size-6 xl:hidden xl:size-0 " />
						<span class=" m-auto hidden xl:inline">Agent editor</span>
					</Tabs.Trigger>

					<Tabs.Trigger value="session" class="flex items-center truncate">
						<IconWrenchRegular class="m-auto size-6 xl:hidden xl:size-0 " />
						<span
							class=" m-auto hidden xl:inline {$errors?.sessionRuntimeSettings?.ttl
								? 'text-destructive'
								: ''}">Session details</span
						>
					</Tabs.Trigger>
					<Tabs.Trigger value="groups" class="flex items-center truncate">
						<IconWrenchRegular class="m-auto size-6 xl:hidden xl:size-0 " />
						Agent Groups
					</Tabs.Trigger>
				</Tabs.List>
				{@const availableOptions = {}}
				{#key selectedAgent}
					<Tabs.Content value="agent" class="flex min-h-0 flex-col gap-4 overflow-y-scroll ">
						{#if selectedAgent !== null && curAgent && curCatalog}
							{#if !detailedAgent}
								<Skeleton />
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
										name="agents[{selectedAgent}].id.name"
										class="flex grow items-center gap-2 truncate"
									>
										<Form.Control>
											{#snippet children({ props })}
												{@const id = $formData.agents[selectedAgent!]!.id}
												<TooltipLabel
													tooltip={'Agent type from the server agent registry'}
													class="w m-0 max-w-1/4 truncate">Registry Type</TooltipLabel
												>
												<Combobox
													{...props}
													class=" m-0 w-0 grow truncate pr-[2px] "
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
													onValueChange={async (value) => {
														$formData.agents[selectedAgent!]!.id = value;

														await tick();

														// Clean up options that are no longer valid
														for (const name in $formData.agents[selectedAgent!]!.options) {
															if (!(name in availableOptions)) {
																delete $formData.agents[selectedAgent!]!.options[name];
															}
														}

														// Refresh the agents object to trigger reactivity
														$formData.agents = $formData.agents;

														// Fetch detailed info for the new agent
														const detailed = await getDetailed(value);
														if (detailed && detailed.registryAgent.runtimes) {
															// Pick the first available runtime
															const firstRuntimeKey = Object.keys(
																detailed.registryAgent.runtimes
															)[0];
															if (firstRuntimeKey) {
																$formData.agents[selectedAgent!]!.provider.runtime =
																	firstRuntimeKey as any;
															}
														}
													}}
												/>
											{/snippet}
										</Form.Control><Form.ElementField
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
														class="w-auto grow pr-[2px] "
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
													tooltip={'Will only show available options for the selected agent type'}
													class="m-0 max-w-1/4">Runtime</TooltipLabel
												>
												<Combobox
													{...props}
													class="w-auto grow pr-[2px]"
													side="right"
													align="start"
													options={[
														{
															items: Object.keys(detailedAgent?.registryAgent?.runtimes ?? {})
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
																	{@render optionRow(name, opt)}
																{/each}
															</ol>
														</Accordion.Content>
													</Accordion.Item>
												</Accordion.Root>
											{:else}
												<ol>
													{#each entries as [name, opt] (name)}
														{@render optionRow(name, opt)}
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
				<Tabs.Content value="session" class="flex flex-col gap-4 px-4">
					<h1>Session settings</h1>

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
					<Separator />
				</Tabs.Content>
				<Tabs.Content value="groups" class="flex flex-col gap-4 px-4">
					<h1>Agent Groups</h1>
					<header class="flex gap-2">
						<p class="text-sm">Agents require a shared group to communicate with each other.</p>
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
					<ul class="mt-2 flex flex-col gap-4">
						{#each $formData.groups as link, i}
							<Accordion.Root type="single">
								<Accordion.Item value="item-1">
									<Accordion.Trigger variant="compact">
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
												<span>Add agents</span>
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
										<ol class="list-decimal pl-4">
											{#each link as agentName, j}
												<li>{agentName}</li>
											{/each}
										</ol>
									</Accordion.Content>
								</Accordion.Item>
							</Accordion.Root>
						{/each}
					</ul>
				</Tabs.Content>
				<!-- <Tabs.Content value="provider" class="flex flex-col gap-4 p-4">
						{#if !detailedAgent}
							<Skeleton />
						{:else}
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
						{/if}
					</Tabs.Content> -->
			</Tabs.Root>
		</Resizable.Pane>
	</Resizable.PaneGroup>
</form>

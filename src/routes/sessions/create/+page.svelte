<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Separator } from '$lib/components/ui/separator';
	import IconCrane from 'phosphor-icons-svelte/IconCraneRegular.svelte';
	import IconWrenchRegular from 'phosphor-icons-svelte/IconWrenchRegular.svelte';
	import IconMenu from 'phosphor-icons-svelte/IconListRegular.svelte';
	import IconPrompt from 'phosphor-icons-svelte/IconChatCircleDotsRegular.svelte';
	import * as Resizable from '$lib/components/ui/resizable/index.js';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';

	import * as Select from '$lib/components/ui/select';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Toggle } from '$lib/components/ui/toggle';
	import * as Form from '$lib/components/ui/form';
	import { Checkbox } from '$lib/components/ui/checkbox';

	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Label } from '$lib/components/ui/label';
	import { Button, buttonVariants } from '$lib/components/ui/button';

	// TODO: change these icons
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { ClipboardCopy, PlusIcon, TrashIcon } from '@lucide/svelte';

	import { cn } from '$lib/utils';
	import {
		idAsKey,
		sessionCtx,
		type CustomTool,
		type GraphAgentRequest,
		type PublicRegistryAgent,
		type Registry
	} from '$lib/threads';
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
	import Card from '$lib/components/ui/card/card.svelte';
	import type { HTMLInputTypeAttribute } from 'svelte/elements';
	import createClient from 'openapi-fetch';
	import type { paths, components } from '$generated/api';
	import SidebarMenuAction from '$lib/components/ui/sidebar/sidebar-menu-action.svelte';
	import FormField from '$lib/components/ui/form/form-field.svelte';
	import { tick } from 'svelte';

	import { socketCtx } from '$lib/socket.svelte';
	import { toggleMode } from 'mode-watcher';

	let sessCtx = sessionCtx.get();

	type CreateSessionRequest = components['schemas']['SessionRequest'];

	/// {a?: number | undefined} -> {a: number | undefined}
	type Complete<T> = {
		[P in keyof Required<T>]: Pick<T, P> extends Required<Pick<T, P>> ? T[P] : T[P] | undefined;
	};

	let ctx = sessionCtx.get();

	const inputTypes: {
		[K in PublicRegistryAgent['options'][string]['type']]: HTMLInputTypeAttribute;
	} = {
		string: 'text',
		number: 'text',
		secret: 'password'
	};

	let registryRaw = sessCtx.registry ?? [];

	let registry = $derived(Object.fromEntries(registryRaw.map((a) => [idAsKey(a.id), a])));

	let formSchema = $derived(schemas.makeFormSchema(registry));
	let form = $derived(
		superForm(defaults(zod4(formSchema)), {
			SPA: true,
			dataType: 'json',
			validators: zod4(formSchema),
			async onUpdate({ form: f }) {
				if (!f.valid) {
					toast.error('Please fix all errors in the form.');
					return;
				}
				if (!ctx.connection) {
					throw new Error('Invalid connection to server!');
				}
				try {
					const client = createClient<paths>({
						baseUrl: `${location.protocol}//${ctx.connection.host}`
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
						if (!ctx.sessions) ctx.sessions = [];
						ctx.sessions.push(res.data.sessionId);
						ctx.session = new Session({
							...ctx.connection,
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
		})
	);

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
<main class="flex grow flex-col items-center justify-center">
	<Resizable.PaneGroup direction="vertical" class="min-h-[200px] w-full  ">
		<Resizable.Pane defaultSize={25}>
			<div class="flex h-full items-center justify-center p-6">
				<span class="font-semibold">session details</span>
			</div>
		</Resizable.Pane>
		<Resizable.Handle />
		<Resizable.Pane defaultSize={75}>
			<Resizable.PaneGroup direction="horizontal" class="min-h-[200px] w-full  ">
				<Resizable.Pane defaultSize={25} class="m-4 flex flex-col gap-4">
					<Accordion.Root type="single">
						<Accordion.Item value="item-1">
							<Accordion.Trigger>Agent creator</Accordion.Trigger>
							<Accordion.Content>
								<Tabs.Root value="agents" class="grow overflow-hidden">
									<Tabs.List class=" w-full">
										<Tabs.Trigger value="agents"><IconMenu class="size-6" />Specs</Tabs.Trigger>
										<Tabs.Trigger value="groups"><IconPrompt class="size-6" />Prompt</Tabs.Trigger>
										<Tabs.Trigger value="export"
											><IconWrenchRegular class="size-6" />Tools</Tabs.Trigger
										>
									</Tabs.List>
									<Tabs.Content
										value="agents"
										class="grid grow grid-cols-4  gap-1 gap-x-2 overflow-hidden"
									>
										<aside class="row-span-full flex min-h-0 grow flex-col gap-2 overflow-hidden">
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
													const count = $formData.agents.filter(
														(agent) => agent.id.name === id.name
													).length;
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
												}}
											>
												{#snippet trigger({ props })}
													<Button {...props} size="icon" class="w-full gap-1 px-3"
														>New agent<PlusIcon /></Button
													>{/snippet}
												{#snippet option({ option })}
													{option.label}
												{/snippet}
											</Combobox>
											<ScrollArea
												class="bg-card text-card-foreground row-span-full flex h-full min-h-0 grow flex-col gap-6 overflow-scroll rounded-md border shadow-sm"
											>
												<ul
													class="flex h-full min-h-0 w-full grow flex-col content-stretch gap-1 p-1"
												>
													{#each $formData.agents as agent, i}
														<li class="contents">
															<Toggle
																class="flex justify-start pr-0"
																bind:pressed={() => selectedAgent === i, () => (selectedAgent = i)}
															>
																<p class="grow">{agent.name}</p>
																<TwostepButton
																	class="size-9"
																	variant="outline"
																	onclick={() => {
																		$formData.agents.splice(i, 1);
																		$formData.agents = $formData.agents;
																		selectedAgent =
																			selectedAgent &&
																			Math.min(selectedAgent, $formData.agents.length - 1);
																	}}><TrashIcon /></TwostepButton
																>
															</Toggle>
														</li>
													{/each}
													{#if $formData.agents.length == 0}
														<li class="contents">
															<p
																class="text-muted-foreground flex h-9 grow items-center justify-center text-sm"
															>
																No agents added.
															</p>
														</li>
													{:else}
														<li class="grow"></li>
													{/if}
												</ul>
											</ScrollArea>
										</aside>
										{#if selectedAgent !== null && $formData.agents.length > selectedAgent}
											{@const agent = $formData.agents[selectedAgent]!}
											{@const availableOptions = agent && registry[idAsKey(agent.id)]?.options}
											<Tabs.Root value="options" class="col-span-3 min-h-0 overflow-hidden">
												<Tabs.List>
													<Tabs.Trigger value="options">Options</Tabs.Trigger>
													<Tabs.Trigger value="prompt">Prompt</Tabs.Trigger>
													<Tabs.Trigger value="tools">Tools</Tabs.Trigger>
												</Tabs.List>

												<Tabs.Content
													value="options"
													class="flex min-h-0 flex-col gap-2 overflow-scroll"
												>
													{#if availableOptions && selectedAgent !== null && $formData.agents.length > selectedAgent}
														<Form.ElementField
															{form}
															name="agents[{selectedAgent}].name"
															class="flex items-center gap-2"
														>
															<Form.Control>
																{#snippet children({ props })}
																	<TooltipLabel
																		tooltip={'Name of the agent in this session'}
																		class="m-0">Name</TooltipLabel
																	>
																	<Input
																		{...props}
																		bind:value={$formData.agents[selectedAgent!]!.name}
																	/>
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
																		searchPlaceholder="Search agents..."
																		onValueChange={(value) => {
																			$formData.agents[selectedAgent!]!.id = value;
																			$formData.agents = $formData.agents;
																			tick().then(() => {
																				for (const name in $formData.agents[selectedAgent!]!
																					.options) {
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
																	{@const runtime =
																		$formData.agents[selectedAgent!]!.provider.runtime}
																	<TooltipLabel
																		tooltip={'What runtime to use for this agent.'}
																		class="m-0">Runtime</TooltipLabel
																	>
																	<Combobox
																		{...props}
																		class="w-auto grow pr-[2px]"
																		side="right"
																		align="start"
																		options={(
																			(registry[idAsKey(agent.id)]?.runtimes as any) ?? []
																		).map((value: string) => ({
																			key: value,
																			label: value,
																			value
																		}))}
																		searchPlaceholder="Search agents..."
																		bind:selected={
																			() => ({ key: runtime, label: runtime, value: runtime }),
																			(selected) => {
																				$formData.agents[selectedAgent!]!.provider.runtime =
																					selected.value;
																			}
																		}
																	/>
																{/snippet}
															</Form.Control>
														</Form.ElementField>
														<Separator />
														{#each Object.entries(availableOptions) as [name, opt] (name)}
															<Form.ElementField
																{form}
																name="agents[{selectedAgent}].options.{name}.value"
															>
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
																				() =>
																					$formData.agents[selectedAgent!]!.options[name]?.value,
																				(value) => {
																					$formData.agents[selectedAgent!]!.options[name] = {
																						type: opt.type,
																						value
																					} as any; // FIXME: !!
																				}
																			}
																			placeholder={'default' in opt
																				? opt.default?.toString()
																				: undefined}
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
																	class="grow resize-none"
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
																						$formData.agents[selectedAgent!]?.customToolAccess?.has(
																							tool
																						) ?? false,
																					() => {}
																				}
																				onCheckedChange={(checked) => {
																					if (
																						selectedAgent === null ||
																						!$formData.agents[selectedAgent]
																					)
																						return;
																					if (checked)
																						$formData.agents[selectedAgent!]!.customToolAccess.add(
																							tool
																						);
																					else
																						$formData.agents[
																							selectedAgent!
																						]!.customToolAccess.delete(tool);
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
										{/if}
									</Tabs.Content>
								</Tabs.Root>
							</Accordion.Content>
						</Accordion.Item>
					</Accordion.Root>
					<Accordion.Root type="single">
						<Accordion.Item value="item-1">
							<Accordion.Trigger>Groups</Accordion.Trigger>
							<Accordion.Content>bosh</Accordion.Content>
						</Accordion.Item>
					</Accordion.Root>
				</Resizable.Pane>
				<Resizable.Handle withHandle />
				<Resizable.Pane defaultSize={75}>
					<div class="flex h-full items-center justify-center p-6">
						<span class="font-semibold">
							<img
								src="https://miro.medium.com/v2/resize:fit:800/0*gp15qj6JZpF0tn38.png"
								alt="coral logo"
							/>
						</span>
					</div>
				</Resizable.Pane>
			</Resizable.PaneGroup>
		</Resizable.Pane>
	</Resizable.PaneGroup>
</main>

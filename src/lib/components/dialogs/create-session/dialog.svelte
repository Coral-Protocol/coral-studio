<script lang="ts">
	import * as Select from '$lib/components/ui/select';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Toggle } from '$lib/components/ui/toggle';
	import * as Form from '$lib/components/ui/form';
	import { Checkbox } from '$lib/components/ui/checkbox';

	import Separator from '$lib/components/ui/separator/separator.svelte';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Label } from '$lib/components/ui/label';
	import { Button, buttonVariants } from '$lib/components/ui/button';

	// TODO: change these icons
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { ClipboardCopy, PlusIcon, TrashIcon, X } from '@lucide/svelte';

	import { cn } from '$lib/utils';
	import {
		sessionCtx,
		type CustomTool,
		type GraphAgentRequest,
		type PublicRegistryAgent
	} from '$lib/threads';
	import { Session } from '$lib/session.svelte';
	import { tools } from '$lib/mcptools';

	import ClipboardImportDialog from '../clipboard-import-dialog.svelte';

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
	import type { paths, components } from '../../../../generated/api';
	import SidebarMenuAction from '$lib/components/ui/sidebar/sidebar-menu-action.svelte';
	import FormField from '$lib/components/ui/form/form-field.svelte';

	type CreateSessionRequest = components['schemas']['CreateSessionRequest'];

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

	let {
		open = $bindable(false),
		agents
	}: { open: boolean; agents: { [id: string]: PublicRegistryAgent } } = $props();

	let formSchema = $derived(schemas.makeFormSchema(agents));
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
				if (!ctx.connection) return;
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
						let error: { message: string; stackTrace: string[] } = res.error;
						console.error(error.stackTrace);

						toast.error(`Failed to create session: ${error.message}`);
						return;
					}
					if (res.data) {
						if (!ctx.sessions) ctx.sessions = [];
						ctx.sessions.push(res.data.session_id);
						ctx.session = new Session({
							...ctx.connection,
							session: res.data.session_id
						});
						open = false;
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
			links: data.agent_graph?.links ?? [],
			applicationId: data.application_id,
			privacyKey: data.privacy_key,
			agents: Object.entries(data.agent_graph?.agents ?? {})
				.filter(([_, agent]) => agent.provider.type === 'local')
				.map(([name, agent]) => ({
					name,
					agentName: agent.agent_name,
					provider: agent.provider as any, // FIXME: annoying hack since ts doesn't know we filtered for local providers
					blocking: agent.blocking ?? true,
					options: agent.options,
					customTools: new Set(agent.tools)
				}))
		};
		selectedAgent = $formData.agents.length > 0 ? 0 : null;
	};

	let usedTools = $derived(
		new Set($formData.agents.flatMap((agent) => Array.from(agent.customTools)))
	) as Set<keyof typeof tools>;
	let asJson: CreateSessionRequest = $derived.by(() => {
		return {
			privacy_key: $formData.privacyKey,
			application_id: $formData.applicationId,
			agent_graph: {
				agents: Object.fromEntries(
					$formData.agents.map((agent) => [
						agent.name,
						{
							provider: agent.provider,
							blocking: agent.blocking,
							options: agent.options as any, // FIXME: !!!
							system_prompt: agent.systemPrompt,
							agent_name: agent.agentName,
							tools: Array.from(agent.customTools)
						} satisfies Complete<NonNullable<CreateSessionRequest['agent_graph']>['agents'][string]>
					])
				),
				tools: Object.fromEntries(Array.from(usedTools).map((tool) => [tool, tools[tool]])) as any, // FIXME: !!!
				links: $formData.links
			}
		} satisfies CreateSessionRequest;
	});

	let selectedAgent: number | null = $state(null);
</script>

{#if ctx.connection}
	<Dialog.Root bind:open>
		<Dialog.Content
			class="grid max-h-[90svh] w-full grid-cols-[100%] grid-rows-[max-content_minmax(0,1fr)_max-content] gap-y-2 md:max-w-3xl lg:max-w-5xl"
		>
			<Dialog.Header>
				<Dialog.Title>New Session</Dialog.Title>
				<Dialog.Description class="flex items-baseline justify-between gap-2">
					<span class="grow">Create a new session.</span>
					<ClipboardImportDialog onImport={importFromJson}>
						{#snippet child({ props })}
							<Button {...props} variant="outline" class="w-fit">Import <ClipboardCopy /></Button>
						{/snippet}
					</ClipboardImportDialog>
					<ClipboardImportDialog onImport={importFromJson}>
						{#snippet child({ props })}
							<Button {...props} variant="outline" class="w-fit">Export <ClipboardCopy /></Button>
						{/snippet}
					</ClipboardImportDialog>
				</Dialog.Description>
			</Dialog.Header>
			<form method="POST" use:enhance autocomplete="off" class="flex flex-col gap-4">
				<ScrollArea class="">
					<section class="flex max-w-full flex-col gap-2">
						<Separator class="mt-2" />
						<section
							class="grid h-96 grid-cols-4 grid-rows-[min-content_1fr] gap-1 gap-x-4 overflow-hidden"
						>
							<section class="flex h-96 flex-col gap-2">
								<ScrollArea
									class="bg-card text-card-foreground row-span-full flex min-h-0 grow flex-col gap-6 rounded-md border shadow-sm"
								>
									<ul class="flex h-full min-h-0 w-full grow flex-col content-stretch gap-2">
										{#each $formData.agents as agent, i}
											<li class="contents">
												<Toggle
													class="group relative flex justify-start rounded-none pr-0"
													bind:pressed={() => selectedAgent === i, () => (selectedAgent = i)}
												>
													<p class="grow">{agent.name}</p>

													<TwostepButton
														class="absolute top-0 right-0 hidden size-9  {selectedAgent === i
															? 'block'
															: 'group-hover:block'} "
														variant="ghost"
														onclick={() => {
															$formData.agents.splice(i, 1);
															$formData.agents = $formData.agents;
															selectedAgent =
																selectedAgent &&
																Math.min(selectedAgent, $formData.agents.length - 1);
														}}><X /></TwostepButton
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
								<Combobox
									side="top"
									align="center"
									options={Object.keys(agents)}
									searchPlaceholder="Search agents..."
									onValueChange={(value) => {
										const count = $formData.agents.filter(
											(agent) => agent.agentName === value
										).length;
										$formData.agents.push({
											agentName: value,
											provider: {
												type: 'local',
												runtime: agents[value]?.runtimes?.at(-1) ?? 'executable'
											},
											systemPrompt: undefined,
											blocking: true,
											name: value + (count > 0 ? `-${count + 1}` : ''),
											options: {},
											customTools: new Set()
										});
										$formData.agents = $formData.agents;
										selectedAgent = $formData.agents.length - 1;
									}}
								>
									{#snippet trigger({ props })}
										<Button {...props} size="icon" class="w-full gap-1 px-3"
											>Add agent <PlusIcon />
										</Button>
									{/snippet}
									{#snippet option({ option })}
										{option}
									{/snippet}
								</Combobox>
							</section>
							{#if selectedAgent !== null && $formData.agents.length > selectedAgent}
								{@const agent = $formData.agents[selectedAgent]!}
								{@const availableOptions = agent && agents[agent.agentName]?.options}
								<Tabs.Root value="options" class="col-span-3 min-h-0">
									<Tabs.List class="w-full">
										<Tabs.Trigger value="options">Options</Tabs.Trigger>
										<Tabs.Trigger value="prompt">Prompt</Tabs.Trigger>
										<Tabs.Trigger value="tools">Tools</Tabs.Trigger>
										<Tabs.Trigger value="groups">Groups</Tabs.Trigger>
									</Tabs.List>
									<ScrollArea class="h-96 px-4">
										<Tabs.Content value="options" class="flex min-h-0 flex-col gap-4">
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
													name="agents[{selectedAgent}].agentName"
													class="flex items-center gap-2"
												>
													<Form.Control>
														{#snippet children({ props })}
															<TooltipLabel tooltip={'Type of this agent'} class="m-0"
																>Type</TooltipLabel
															>
															<Combobox
																{...props}
																class="w-auto grow pr-[2px]"
																side="right"
																align="start"
																options={Object.keys(agents)}
																searchPlaceholder="Search agents..."
																bind:value={$formData.agents[selectedAgent!]!.agentName}
																onValueChange={() => {
																	for (const name in $formData.agents[selectedAgent!]!.options) {
																		if (!(name in availableOptions)) {
																			delete $formData.agents[selectedAgent!]!.options[name];
																		}
																	}
																	$formData.agents = $formData.agents;
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
															<TooltipLabel
																tooltip={'What runtime to use for this agent.'}
																class="m-0">Runtime</TooltipLabel
															>
															<Combobox
																{...props}
																class="w-auto grow pr-[2px]"
																side="right"
																align="start"
																options={agents[agent.agentName]?.runtimes ?? []}
																searchPlaceholder="Search agents..."
																bind:value={$formData.agents[selectedAgent!]!.provider.runtime}
															/>
														{/snippet}
													</Form.Control>
												</Form.ElementField>
												<Separator />
												{#each Object.entries(availableOptions) as [name, opt] (name)}
													<Form.ElementField
														{form}
														name="agents[{selectedAgent}].options.{name}.value"
														class="flex flex-col gap-2"
													>
														<Form.Control>
															{#snippet children({ props })}
																<TooltipLabel tooltip={opt.description} class="gap-2">
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
										<Tabs.Content value="prompt">
											<Form.ElementField {form} name="agents[{selectedAgent}].systemPrompt">
												<Form.Control>
													{#snippet children({ props })}
														<Form.Label class="text-muted-foreground leading-tight"
															>Additional system prompt to add to this agent.</Form.Label
														>
														<Textarea
															{...props}
															bind:value={$formData.agents[selectedAgent!]!.systemPrompt}
														/>
													{/snippet}
												</Form.Control>
											</Form.ElementField>
										</Tabs.Content>
										<Tabs.Content value="tools">
											<Form.Fieldset {form} name="agents[{selectedAgent}].customTools">
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
																				$formData.agents[selectedAgent!]?.customTools?.has(tool) ??
																				false,
																			() => {}
																		}
																		onCheckedChange={(checked) => {
																			if (
																				selectedAgent === null ||
																				!$formData.agents[selectedAgent]
																			)
																				return;
																			if (checked)
																				$formData.agents[selectedAgent!]!.customTools.add(tool);
																			else
																				$formData.agents[selectedAgent!]!.customTools.delete(tool);
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
										<Tabs.Content value="groups" class="flex flex-col gap-2">
											<ul class="flex flex-col gap-1">
												{#each $formData.links as link, i}
													<Select.Root
														type="multiple"
														value={link}
														onValueChange={(value) => {
															$formData.links[i] = value;
															$formData.links = $formData.links;
														}}
													>
														<Select.Trigger>
															{#if link.length == 0}
																<span class="text-muted-foreground text-sm italic"
																	>Group {i + 1} &#40;no members&#41;</span
																>
															{:else if link.length == 1}
																Group {i + 1} &#40;{link.length} member&#41;
															{:else}
																Group {i + 1} &#40;{link.length} members&#41;
															{/if}
														</Select.Trigger>
														<Select.Content>
															{#if $formData.agents.length == 0}
																<span class="text-muted-foreground px-2 text-sm italic"
																	>No agents</span
																>
															{/if}
															{#each new Set($formData.agents.map((agent) => agent.name)) as id}
																<Select.Item value={id}>{id}</Select.Item>
															{/each}
														</Select.Content>
													</Select.Root>
												{/each}
											</ul>
											<Button
												size="icon"
												class="w-full gap-1 px-3"
												disabled={($formData.links.at(-1)?.length ?? 1) == 0}
												onclick={() => {
													$formData.links = [...$formData.links, []];
												}}>Create group<PlusIcon /></Button
											>
										</Tabs.Content>
									</ScrollArea>
								</Tabs.Root>
							{/if}
						</section>

						<!-- <ModalCollapsible title="Groups">
							<p class="text-muted-foreground text-sm leading-tight">
								Define a list of groups, where each agent in a group can all interact.
							</p>
							<ul class="mt-2 flex flex-col gap-1">
								{#each $formData.links as link, i}
									<Select.Root
										type="multiple"
										value={link}
										onValueChange={(value) => {
											$formData.links[i] = value;
											$formData.links = $formData.links;
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
							</ul>
						</ModalCollapsible> -->
						<!-- <ModalCollapsible title="Export">
							<CodeBlock text={JSON.stringify(asJson, null, 2)} class="" language="json" />
							<!-- TODO: add an Issues: collapsible with a user friendly list (e.g "Agents > my-agent > API_KEY : misssing required field", and it's clickable)
							<!-- <CodeBlock text={JSON.stringify($errors, null, 2)} class="" language="json" />
						</ModalCollapsible> -->
					</section>
				</ScrollArea>
				<Separator />
				<Dialog.Footer>
					<Form.Field {form} name="applicationId">
						<Form.Control>
							{#snippet children({ props })}
								<Input
									{...props}
									bind:value={$formData.applicationId}
									autocomplete="one-time-code"
									placeholder="Application ID"
								/>
							{/snippet}
						</Form.Control>
					</Form.Field>
					<Form.Field {form} name="privacyKey" class="grow">
						<Form.Control>
							{#snippet children({ props })}
								<Input
									{...props}
									type="password"
									bind:value={$formData.privacyKey}
									placeholder="Privacy Key"
								/>
							{/snippet}
						</Form.Control>
					</Form.Field>
					<Form.Button class="ml-auto">Create</Form.Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
{/if}

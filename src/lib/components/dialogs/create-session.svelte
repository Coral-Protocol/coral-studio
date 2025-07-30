<script lang="ts">
	import * as Select from '$lib/components/ui/select';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as Tooltip from '$lib/components/ui/tooltip';

	import Separator from '$lib/components/ui/separator/separator.svelte';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Label } from '$lib/components/ui/label';
	import { Button, buttonVariants } from '$lib/components/ui/button';

	// TODO: change these icons
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { ClipboardCopy, PlusIcon, TrashIcon } from '@lucide/svelte';

	import { cn } from '$lib/utils';
	import {
		sessionCtx,
		type Agent,
		type AgentOption,
		type CustomTool,
		type RegistryAgent
	} from '$lib/threads';
	import { Session } from '$lib/session.svelte';
	import { tools } from '$lib/mcptools';

	import ClipboardImportDialog from './clipboard-import-dialog.svelte';

	import Combobox from '$lib/components/combobox.svelte';
	import CodeBlock from '$lib/components/code-block.svelte';
	import TooltipLabel from '$lib/components/tooltip-label.svelte';
	import TwostepButton from '$lib/components/twostep-button.svelte';
	import ModalCollapsible from '$lib/components/modal-collapsible.svelte';

	import { toast } from 'svelte-sonner';
	import { watch } from 'runed';
	import { SvelteSet } from 'svelte/reactivity';
	import { Textarea } from '../ui/textarea';
	import type { HTMLInputTypeAttribute } from 'svelte/elements';

	let ctx = sessionCtx.get();

	const inputTypes: { [K in AgentOption['type']]: HTMLInputTypeAttribute } = {
		string: 'string',
		secret: 'password',
		number: 'number'
	};

	let {
		open = $bindable(false),
		agents
	}: { open: boolean; agents: { [id: string]: RegistryAgent } } = $props();

	let graph: {
		agents: (RegistryAgent & {
			name: string;
			tools: (keyof typeof tools)[];
			systemPrompt?: string;
		})[];
	} = $state({
		agents: []
	});

	let finalBody: {
		agentGraph: {
			agents: { [name: string]: Agent };
			links: string[][];
			tools: { [name: string]: CustomTool };
		};
	} = $state({
		agentGraph: { agents: {}, links: [], tools: {} }
	});
	let finalAgentIds = $derived(graph.agents.map((a) => a.name));
	let finalAgentTools = $derived(graph.agents.map((a) => a.tools));
	let finalAgentOptions = $derived(
		Object.fromEntries(
			graph.agents.map((a) => [
				a.name,
				Object.fromEntries(Object.entries(a.options).map(([k, v]) => [k, v.value]))
			])
		)
	);
	let reactivityHack = $derived(graph.agents.flatMap((a) => Object.values(a)));
	let duplicateNames: SvelteSet<string> = $state(new SvelteSet());
	let neededTools: SvelteSet<keyof typeof tools> = $state(new SvelteSet());

	watch(
		[() => finalAgentIds, () => finalAgentTools, () => finalAgentOptions, () => reactivityHack],
		() => {
			finalBody.agentGraph.agents = {};
			duplicateNames.clear();
			neededTools.clear();
			for (const agent of graph.agents) {
				if (agent.name in finalBody.agentGraph.agents) {
					duplicateNames.add(agent.name);
					continue;
				}
				for (const tool of agent.tools) {
					neededTools.add(tool);
				}
				finalBody.agentGraph.agents[agent.name] = {
					options: finalAgentOptions[agent.name],
					type: 'local',
					blocking: agent.blocking,
					agentType: agent.id,
					tools: agent.tools,
					systemPrompt: agent.systemPrompt
				};
			}
			finalBody.agentGraph.tools = Object.fromEntries(
				Array.from(neededTools).map((id) => {
					const tool = tools[id];
					return [
						id,
						{
							...tool,
							transport: {
								...tool.transport,
								url: `${window.location.origin}${tool.transport.url}`
							}
						}
					];
				})
			) as any;
		}
	);

	let valid = $derived(
		!!ctx.connection &&
			ctx.connection.privacyKey.length > 0 &&
			ctx.connection.appId.length > 0 &&
			duplicateNames.size == 0 &&
			graph.agents.every((v) => {
				return Object.values(v.options).every((opt) => {
					console.log({
						opt,
						default: opt.default,
						value: opt.value,
						valid: opt.default !== null || !!opt.value
					});
					return opt.default !== null || !!opt.value;
				});
			})
	);

	const importFromJson = (text: string) => {
		const data: { agentGraph: { agents: { [name: string]: Agent }; links?: string[][] } } =
			JSON.parse(text);
		if (
			!('agentGraph' in data) ||
			typeof data.agentGraph !== 'object' ||
			!data.agentGraph ||
			!('agents' in data.agentGraph) ||
			typeof data.agentGraph.agents !== 'object' ||
			!data.agentGraph.agents
		) {
			return;
		}
		// TODO(alan): proper validation (e.g zod)
		graph.agents = [];
		finalBody.agentGraph.links = data.agentGraph.links ?? [];
		const importAgents = data.agentGraph.agents;
		for (const [name, agent] of Object.entries(importAgents)) {
			const newAgent: RegistryAgent & {
				name: string;
				tools: (keyof typeof tools)[];
				systemPrompt?: string;
			} = {
				name,
				id: agent.agentType,
				blocking: agent.blocking,
				// TODO (alan): handle when this lookup fails
				options: agents[agent.agentType].options,
				systemPrompt: agent.systemPrompt,
				tools: (agent.tools ?? []) as any
			};
			for (const [oName, opt] of Object.entries(agent.options)) {
				newAgent.options[oName].value = opt as any;
			}
			graph.agents.push(newAgent);
		}
	};
</script>

{#if ctx.connection}
	<Dialog.Root bind:open>
		<Dialog.Content
			class="grid max-h-[90svh] grid-cols-[100%] grid-rows-[max-content_minmax(0,1fr)_max-content] gap-y-2 lg:max-w-2xl"
		>
			<Dialog.Header>
				<Dialog.Title>New Session</Dialog.Title>
				<Dialog.Description>Create a new session.</Dialog.Description>
			</Dialog.Header>
			<ScrollArea class="">
				<section class="flex max-w-full flex-col gap-2 pr-4">
					<section class="grid grid-cols-[minmax(0,max-content)_auto] gap-4 gap-y-2 pt-2">
						<TooltipLabel>Application ID</TooltipLabel>
						<Input
							required
							placeholder="appId"
							bind:value={ctx.connection.appId}
							aria-invalid={ctx.connection.appId.length === 0}
						/>
						<TooltipLabel>Privacy Key</TooltipLabel>
						<Input
							required
							placeholder="privKey"
							bind:value={ctx.connection.privacyKey}
							aria-invalid={ctx.connection.privacyKey.length === 0}
						/>
					</section>
					<ClipboardImportDialog onImport={importFromJson}>
						{#snippet child({ props })}
							<Button {...props} variant="outline" class="w-fit">Import <ClipboardCopy /></Button>
						{/snippet}
					</ClipboardImportDialog>
					<Separator class="mt-2" />
					<ModalCollapsible title="Agents">
						<ul class="flex flex-col gap-1">
							{#each graph.agents as agent, i}
								<Collapsible.Root class="group/collapsible" open={true}>
									<div class="flex flex-row items-center gap-1">
										<Collapsible.Trigger
											class={cn(buttonVariants({ size: 'icon', variant: 'ghost' }), 'size-8')}
										>
											<ChevronRightIcon
												class="transition-transform group-data-[state=open]/collapsible:rotate-90"
											/>
										</Collapsible.Trigger>
										<Input
											bind:value={agent.name}
											placeholder="agent name"
											aria-invalid={!agent.name || duplicateNames.has(agent.name)}
										/>
										<Combobox
											bind:value={agent.id}
											options={Object.keys(agents)}
											onValueChange={(id) => {
												const newAgent = agents[id];
												if (!newAgent) return;
												agent.options = newAgent.options;
											}}
											selectPlaceholder="Select an agent..."
											searchPlaceholder="Search agents..."
											emptyLabel="No agents found."
										/>
										<TwostepButton
											variant="destructive"
											size="icon"
											onclick={() => {
												graph.agents.splice(i, 1);
											}}><TrashIcon /></TwostepButton
										>
									</div>
									<Collapsible.Content class="flex flex-col gap-1 p-2 pl-4">
										<Collapsible.Root class="group/options" open={true}>
											<Collapsible.Trigger
												class={cn(
													buttonVariants({ size: 'icon', variant: 'ghost' }),
													'flex h-6 w-max flex-row items-center gap-1 px-2 pl-1'
												)}
											>
												<ChevronRightIcon
													class="transition-transform group-data-[state=open]/options:rotate-90"
												/>
												<h3 class="text-sm font-bold">Options</h3>
											</Collapsible.Trigger>
											<Collapsible.Content
												class="grid grid-cols-[max-content_minmax(0,auto)] gap-2 p-2 pl-4"
											>
												{#each Object.values(agent.options) as option (option.name)}
													{@const required =
														option.default === null || option.default === undefined}
													<Tooltip.Provider>
														<Tooltip.Root disabled={!option.description}>
															<Tooltip.Trigger>
																{#snippet child({ props })}
																	<Label {...props} class="gap-1">
																		{option.name}
																		<span class="text-destructive">{required ? '*' : ''} </span>
																	</Label>
																{/snippet}
															</Tooltip.Trigger>
															<Tooltip.Content>
																<p>{option.description}</p>
															</Tooltip.Content>
														</Tooltip.Root>
													</Tooltip.Provider>
													<Input
														type={inputTypes[option.type]}
														autocomplete="off"
														name={option.name}
														placeholder={required ? '' : (option.default?.toString() ?? '')}
														{required}
														aria-invalid={required && !option.value}
														bind:value={option.value}
													/>
												{/each}
											</Collapsible.Content>
										</Collapsible.Root>
										<Collapsible.Root class="group/tools" open={false}>
											<Collapsible.Trigger
												class={cn(
													buttonVariants({ size: 'icon', variant: 'ghost' }),
													'flex h-6 w-max flex-row items-center gap-1 px-2 pl-1'
												)}
											>
												<ChevronRightIcon
													class="transition-transform group-data-[state=open]/tools:rotate-90"
												/>
												<h3 class="text-sm font-bold">Custom Tools</h3>
											</Collapsible.Trigger>
											<Collapsible.Content class="grid grid-cols-[max-content_auto] gap-2 p-2">
												<Select.Root
													type="multiple"
													value={agent.tools}
													onValueChange={(value) => {
														agent.tools = value as any;
													}}
												>
													<Select.Trigger>
														{#if agent.tools.length == 0}
															<span class="text-muted-foreground text-sm italic"
																>No extra tools.</span
															>
														{:else}
															{agent.tools.join(', ')}
														{/if}
													</Select.Trigger>
													<Select.Content>
														{#if Object.keys(tools).length == 0}
															<span class="text-muted-foreground px-2 text-sm italic">No tools</span
															>
														{/if}
														{#each Object.entries(tools) as [name, tool] (name)}
															<Select.Item value={name}>{tool.toolSchema.name}</Select.Item>
														{/each}
													</Select.Content>
												</Select.Root>
											</Collapsible.Content>
										</Collapsible.Root>
										<Collapsible.Root class="group/prompt" open={false}>
											<Collapsible.Trigger
												class={cn(
													buttonVariants({ size: 'icon', variant: 'ghost' }),

													'flex h-6 w-max flex-row items-center gap-1 px-2 pl-1'
												)}
											>
												<ChevronRightIcon
													class="transition-transform group-data-[state=open]/tools:rotate-90"
												/>

												<h3 class="text-sm font-bold">Prompt</h3>
											</Collapsible.Trigger>

											<Collapsible.Content class="grid grid-cols-1 gap-2 p-2">
												<p class="text-muted-foreground text-sm">
													Inject additional prompt text to the agent's system prompt (the agent must
													support this!)
												</p>

												<Textarea bind:value={agent.systemPrompt} class="" />
											</Collapsible.Content>
										</Collapsible.Root>
									</Collapsible.Content>
								</Collapsible.Root>
							{/each}
						</ul>
						<Combobox
							side="right"
							align="start"
							options={Object.keys(agents)}
							searchPlaceholder="Search agents..."
							onValueChange={(value) => {
								graph.agents.push(
									JSON.parse(
										JSON.stringify({
											...agents[value],
											tools: [],
											name: `agent-${graph.agents.length + 1}`
										})
									)
								);
							}}
						>
							{#snippet trigger({ props })}
								<Button {...props} size="icon" class="mt-2 w-auto gap-1 px-3"
									>New agent<PlusIcon /></Button
								>{/snippet}
							{#snippet option({ option })}
								{option}
							{/snippet}
						</Combobox>
					</ModalCollapsible>
					<ModalCollapsible title="Groups">
						<p class="text-muted-foreground text-sm leading-tight">
							Define a list of groups, where each agent in a group can all interact.
						</p>
						<ul class="mt-2 flex flex-col gap-1">
							{#each finalBody.agentGraph.links as link, i}
								<Select.Root
									type="multiple"
									value={link}
									onValueChange={(value) => {
										finalBody.agentGraph.links[i] = value;
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
										{#if Object.keys(finalBody.agentGraph.agents).length == 0}
											<span class="text-muted-foreground px-2 text-sm italic">No agents</span>
										{/if}
										{#each Object.keys(finalBody.agentGraph.agents) as id}
											<Select.Item value={id}>{id}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							{/each}
							<Button
								size="icon"
								class="w-fit gap-1 px-3"
								disabled={(finalBody.agentGraph.links.at(-1)?.length ?? 1) == 0}
								onclick={() => {
									finalBody.agentGraph.links.push([]);
								}}>New group<PlusIcon /></Button
							>
						</ul>
					</ModalCollapsible>
					<ModalCollapsible title="Export">
						<CodeBlock text={JSON.stringify(finalBody, null, 2)} class="" language="json" />
					</ModalCollapsible>
				</section>
			</ScrollArea>

			<Dialog.Footer>
				<Button
					type="submit"
					onclick={async () => {
						if (!ctx.connection) return;
						try {
							const res = await fetch(`http://${ctx.connection.host}/sessions`, {
								method: 'POST',
								headers: {
									'Content-Type': 'application/json'
								},
								body: JSON.stringify({
									...finalBody,
									applicationId: ctx.connection.appId,
									privacyKey: ctx.connection.privacyKey
								})
							});

							if (res.status != 200) {
								// todo @alan there should probably be an api class where we can generic-ify the handling of this error
								// with a proper type implementation too..!
								let error: { message: string; stackTrace: string[] } = await res.json();
								console.error(error.stackTrace);

								toast.error(`Failed to create session: ${error.message}`);
								return;
							}

							let session: { sessionId: string } = await res.json();

							if (!ctx.sessions) ctx.sessions = [];
							ctx.sessions.push(session.sessionId);
							ctx.session = new Session({
								...ctx.connection,
								session: session.sessionId
							});
							open = false;
						} catch (e) {
							console.log(e);
							toast.error(`Failed to create session: ${e}`);
						}
					}}
					disabled={!valid}>Create</Button
				>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}

<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import * as Sidebar from '$lib/components/ui/sidebar';

	import IconRobot from 'phosphor-icons-svelte/IconRobotRegular.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Separator } from '$lib/components/ui/separator';

	import { socketCtx } from '$lib/socket.svelte';
	import { Button } from '$lib/components/ui/button';
	import IconArrow from 'phosphor-icons-svelte/IconArrowRightRegular.svelte';
	import { arrayProxy } from 'sveltekit-superforms';

	//warning the below ts is a bit of classic ai slop that i will clean up later but for now it works

	// Type definitions
	interface Request {
		id: string;
		agentId: string;
		agentRequest: string;
		userQuestion?: string;
		agentAnswer?: string;
		timestamp: string | number | Date;
		sessionId?: string;
	}

	interface AgentSummary {
		agentId: string;
		latestRequest: string;
		latestTimestamp: string | number | Date;
		totalMessages: number;
	}

	interface AgentGroups {
		[agentId: string]: Request[];
	}

	// Context and state
	let ctx = socketCtx.get();
	let userQuestions: Record<string, string> = $state({});
	let selectedAgentId: string | null = $state(null);

	// Derived values
	let requests = $derived(Object.values(ctx.userInput.requests ?? {}) as Request[]);

	// Group requests by agent ID and sort by timestamp
	let agentGroups = $derived.by(() => {
		const groups: AgentGroups = {};

		for (const request of requests) {
			if (!groups[request.agentId]) {
				groups[request.agentId] = [];
			}
			groups[request.agentId].push(request);
		}

		// Sort each agent's requests by timestamp
		for (const agentId in groups) {
			groups[agentId].sort((a: Request, b: Request) => {
				const timeA = new Date(a.timestamp || 0).getTime();
				const timeB = new Date(b.timestamp || 0).getTime();
				return timeA - timeB;
			});
		}

		return groups;
	});

	// Get list of agents with their latest interaction info
	let agentList = $derived.by(() => {
		const entries = Object.entries(agentGroups);
		const mapped = entries.map(([agentId, agentRequests]: [string, Request[]]) => {
			const latestRequest = agentRequests[agentRequests.length - 1];
			if (!latestRequest) {
				return null;
			}

			const summary: AgentSummary = {
				agentId,
				latestRequest: latestRequest.agentRequest,
				latestTimestamp: latestRequest.timestamp,
				totalMessages: agentRequests.length
			};
			return summary;
		});

		const filtered = mapped.filter((agent): agent is AgentSummary => agent !== null);

		return filtered.sort((a: AgentSummary, b: AgentSummary) => {
			// Sort by latest timestamp descending
			const timeA = new Date(a.latestTimestamp).getTime();
			const timeB = new Date(b.latestTimestamp).getTime();
			return timeA - timeB;
		});
	});

	// Get messages for the selected agent
	let selectedAgentMessages = $derived.by(() => {
		if (!selectedAgentId || !agentGroups[selectedAgentId]) {
			return [] as Request[];
		}
		return agentGroups[selectedAgentId].slice().reverse() as Request[];
	});

	// Get the current pending request for the selected agent (if any)
	let currentPendingRequest = $derived.by(() => {
		return selectedAgentMessages.find((req: Request) => req.userQuestion === undefined);
	});

	$effect(() => {
		for (const request of requests) {
			if (request.userQuestion !== undefined) {
				userQuestions[request.id] = request.userQuestion;
			}
		}
	});

	function stringToColor(str: string): string {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			hash = str.charCodeAt(i) + ((hash << 5) - hash);
		}
		let color = (hash >>> 0).toString(16);
		return '#' + color.padStart(6, '0').slice(0, 6);
	}

	function formatTimestamp(timestamp: string | number | Date): string {
		try {
			return new Date(timestamp).toLocaleTimeString();
		} catch {
			return '';
		}
	}

	function selectAgent(agentId: string): void {
		selectedAgentId = agentId;
	}

	function sendResponse(): void {
		if (!currentPendingRequest) return;

		const response = userQuestions[currentPendingRequest.id];
		if (response) {
			ctx.userInput.respond(currentPendingRequest.id, response);
			// Clear the input
			userQuestions[currentPendingRequest.id] = '';
		}
	}

	function handleKeydown(e: KeyboardEvent): void {
		if (e.key === 'Enter') {
			sendResponse();
		}
	}

	function handleAgentCardClick(agentId: string) {
		return () => selectAgent(agentId);
	}
</script>

<header class="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4">
	<Sidebar.Trigger class="-ml-1" />
	<Separator orientation="vertical" class="mr-2 h-4" />
	<Breadcrumb.Root class="flex-grow">
		<Breadcrumb.List>
			<Breadcrumb.Item class="hidden md:block">
				<Breadcrumb.Link>Tools</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator class="hidden md:block" />
			<Breadcrumb.Item>
				<Breadcrumb.Page>User Input Tool</Breadcrumb.Page>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>
</header>

<section class="grid h-full grid-cols-2 gap-3 p-4 md:grid-cols-3 lg:grid-cols-4">
	<!-- Agent List Sidebar -->
	<section class="flex h-full w-full flex-col gap-4">
		<nav class="flex w-full flex-col gap-2 p-1">
			<h1 class="text-lg font-medium">{agentList.length} Agents</h1>
			<section class="flex w-full gap-2">
				<Input placeholder="Search agents" class="grow" />
				<Button class="">Search</Button>
			</section>
		</nav>

		{#if agentList.length === 0}
			<p class="text-muted-foreground col-span-full text-center text-sm">
				No agents have requested user input.
			</p>
		{:else}
			{#each agentList as agent (agent.agentId)}
				<Card.Root
					class="hover:bg-muted/50 cursor-pointer transition-colors {selectedAgentId ===
					agent.agentId
						? 'bg-muted'
						: ''}"
					onclick={handleAgentCardClick(agent.agentId)}
					role="button"
					tabindex={0}
				>
					<Card.Content class="flex w-full flex-col gap-2 p-3">
						<div class="flex w-full items-center gap-2">
							<div
								class="flex h-12 min-w-12 items-center justify-center rounded-md"
								style="background-color: {stringToColor(agent.agentId)}"
							>
								<IconRobot class="size-6 text-white" />
							</div>
							<section class="flex w-full min-w-0 flex-col gap-1">
								<span class="flex w-full items-center">
									<span class="grow truncate font-medium">{agent.agentId}</span>
									<!-- spot for a badge  -->
								</span>
								<div class="flex items-center justify-between">
									<p class="text-muted-foreground flex-1 truncate text-sm">
										{agent.latestRequest}
									</p>
									<span class="text-muted-foreground ml-2 text-xs">
										{formatTimestamp(agent.latestTimestamp)}
									</span>
								</div>
							</section>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		{/if}
	</section>

	<!-- Chat Interface -->
	<section class="relative col-span-3 min-h-0 w-full">
		{#if selectedAgentId}
			<Card.Root class="absolute top-0 right-0 left-0 flex h-full flex-col overflow-hidden">
				<Card.Header class="flex-shrink-0">
					<Card.Title class="flex w-full items-center gap-2">
						<div
							class="flex h-12 min-w-12 items-center justify-center rounded-md"
							style="background-color: {stringToColor(selectedAgentId)}"
						>
							<IconRobot class="size-6 text-white" />
						</div>
						<span class="grow">{selectedAgentId}</span>
						<span class="text-muted-foreground text-sm">
							{selectedAgentMessages?.length ?? '0'} messages
						</span>
					</Card.Title>
				</Card.Header>

				<Separator />

				<Card.Content class="flex-1 overflow-y-auto">
					<ol class="flex flex-col gap-4 p-4">
						{#each selectedAgentMessages as request, i (request.id)}
							<li
								class="border-card flex h-min flex-col gap-2 rounded-e-md border-l-2 transition-colors {request.id ===
								currentPendingRequest?.id
									? 'bg-primary border-primary-foreground '
									: 'hover:bg-primary rounded-s-md '}"
							>
								<!-- Agent Request -->
								<button
									onclick={() => (currentPendingRequest = request)}
									class="flex flex-col gap-2 p-4 {i !== 0 && !request.userQuestion
										? 'opacity-50'
										: ''} "
								>
									<div class="flex gap-4">
										<div
											class="flex h-8 min-w-8 items-center justify-center rounded-md"
											style="background-color: {stringToColor(request.agentId)}"
										>
											<IconRobot class="size-4 text-white" />
										</div>
										<div
											class="bg-input min-h-8 max-w-[50%] rounded-md p-2 text-start wrap-break-word"
										>
											<p class="text-sm select-text">{request.agentRequest}</p>
											<span class="text-muted-foreground text-xs">
												{formatTimestamp(request.timestamp)}
											</span>
										</div>
										<div class="my-auto flex flex-col">
											<span
												class="text-muted-foreground text-xs {request.id ===
													currentPendingRequest?.id &&
												!request.userQuestion &&
												i === 0
													? ''
													: ' hidden'}">Responding to</span
											>
											<IconArrow
												class="mt-2 rotate-180 {request.id === currentPendingRequest?.id &&
												!request.userQuestion &&
												i === 0
													? 'animate-pulse'
													: ' hidden'}"
											/>
										</div>
									</div>

									<!-- User Response (if exists) -->

									{#if request.userQuestion}
										<div class="flex items-start justify-end gap-4">
											<div
												class="bg-input text-primary-foreground min-h-8 max-w-[50%] rounded-md p-2 text-left wrap-break-word"
											>
												<p class="text-sm select-text">{request.userQuestion}</p>
											</div>
											<div
												class="bg-input flex h-9 min-w-9 items-center justify-center rounded-full"
											>
												<span class="text-xs">You</span>
											</div>
										</div>
									{/if}

									<!-- Agent Answer (if exists) -->
									{#if request.agentAnswer}
										<div class="flex gap-4">
											<div
												class="flex h-8 min-w-8 items-center justify-center rounded-md"
												style="background-color: {stringToColor(request.agentId)}"
											>
												<IconRobot class="size-4 text-white" />
											</div>
											<div class="bg-muted min-h-8 max-w-[70%] rounded-md p-2">
												<p class="text-sm">{request.agentAnswer}</p>
											</div>
										</div>
									{/if}
								</button>

								{#if currentPendingRequest && request.id === currentPendingRequest.id && !request.userQuestion && i === 0}
									<div class="flex flex-shrink-0 gap-2 p-4">
										<Input
											bind:value={userQuestions[currentPendingRequest.id]}
											placeholder="Enter your reply..."
											class="w-full grow"
											onkeydown={handleKeydown}
										/>
										<Button onclick={sendResponse}>Send</Button>
									</div>
								{:else if currentPendingRequest && request.id === currentPendingRequest.id && !request.userQuestion}
									<div class="flex flex-shrink-0 gap-2 p-4">
										<Input
											bind:value={userQuestions[currentPendingRequest.id]}
											placeholder="This request is no longer active or has timed out"
											class="w-full grow"
											onkeydown={handleKeydown}
											disabled
										/>
										<Button disabled>Send</Button>
									</div>
								{/if}
							</li>
						{/each}
					</ol>
				</Card.Content>
			</Card.Root>
		{:else}
			<Card.Root class="flex h-full items-center justify-center">
				<Card.Content>
					<div class="text-muted-foreground text-center">
						<IconRobot class="mx-auto mb-4 h-12 w-12" />
						<p>Select an agent to view the conversation</p>
					</div>
				</Card.Content>
			</Card.Root>
		{/if}
	</section>
</section>

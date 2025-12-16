<script lang="ts">
	import { page } from '$app/state';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Accordion from '$lib/components/ui/accordion';
	import { Separator } from '$lib/components/ui/separator';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { idAsKey } from '$lib/threads';
	import { Button } from '$lib/components/ui/button';
	import CaretRight from 'phosphor-icons-svelte/IconCaretRightRegular.svelte';
	import ExternalLink from 'phosphor-icons-svelte/IconArrowsOutRegular.svelte';
	import { AgentLogs, logContext } from '$lib/logs.svelte';
	import Logs from '$lib/components/logs.svelte';
	import { appContext } from '$lib/context';

	let ctx = appContext.get();
	let logCtx = logContext.get();
	let conn = $derived(ctx.session);

	let threads = $derived(conn?.threads ?? {});
	let agents = $derived(conn?.agents ?? {});

	let agentName = $derived(page.url.hash.substring(1));
	let agent = $derived(agentName ? agents[agentName] : undefined);

	let memberThreads = $derived(
		Object.values(threads).filter((thread) => thread.participants.indexOf(agentName) !== -1)
	);

	let logs = $derived(logCtx.logs[agentName]);
	const ts_fmt = (d: Date) =>
		`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
</script>

<header class="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4">
	<Sidebar.Trigger class="-ml-1" />
	<Separator orientation="vertical" class="mr-2 h-4" />
	<Breadcrumb.Root class="flex-grow">
		<Breadcrumb.List>
			<Breadcrumb.Item class="hidden md:block">
				<Breadcrumb.Link>Agents</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator class="hidden md:block" />
			<Breadcrumb.Item>
				<Breadcrumb.Page>{agentName ?? ''} {agent?.id ?? ''}</Breadcrumb.Page>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>
</header>
{#if agent !== undefined}
	<main class="h-full p-4">
		<Tabs.Root value="main" class="h-full">
			<Tabs.List>
				<Tabs.Trigger value="main">Overview</Tabs.Trigger>
				<Tabs.Trigger value="logs">Logs</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="main">
				<h1 class="text-3xl font-bold">{agentName}</h1>
				<p>{agent.state}</p>
				<!-- <p>{agent.description}</p> -->
				<Accordion.Root type="single" class="w-full sm:max-w-[70%]" value="threads">
					<Accordion.Item value="threads">
						<Accordion.Trigger>Threads</Accordion.Trigger>
						<Accordion.Content class="flex flex-col gap-4 text-balance">
							<ul class="pl-4">
								{#if memberThreads.length === 0}
									<li class="text-muted-foreground text-sm">Not a member of any threads.</li>
								{/if}
								{#each memberThreads as thread (thread.id)}
									<li class="flex items-center">
										<CaretRight class="size-4" />
										<Button variant="link" href={`/thread/${thread.id}`} class="font-bold">
											{thread.name}<ExternalLink class="size-3" />
										</Button>
										<span>
											with:
											{#each thread.participants as part}
												{#if part !== agentName}
													<Button variant="link" href={`/agent/${part}`} class="m-0 px-2"
														>{part}</Button
													>
												{/if}
											{/each}
										</span>
									</li>
								{/each}
							</ul>
						</Accordion.Content>
					</Accordion.Item>
				</Accordion.Root>
			</Tabs.Content>
			<Tabs.Content value="logs" class="h-full min-h-0 basis-0">
				<Logs logs={logs?.logs ?? []} class="h-full max-h-full" />
			</Tabs.Content>
		</Tabs.Root>
	</main>
{:else}
	<p class="text-muted-foreground mt-4 text-center text-sm">Agent not found.</p>
{/if}

<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import * as Command from '$lib/components/ui/command';
	import { Input } from '$lib/components/ui/input';
	import type { AppContext } from '$lib/context';
	import { Session } from '$lib/session.svelte';
	import IconChats from 'phosphor-icons-svelte/IconChatsRegular.svelte';
	import IconRobot from 'phosphor-icons-svelte/IconRobotRegular.svelte';

	let {
		ctx,
		open = $bindable(),
		debugMenu = $bindable()
	}: { ctx: AppContext; open: boolean; debugMenu: boolean } = $props();

	let agents = $derived(
		ctx.session &&
			Object.entries(ctx.session.agents).map(([title, agent]) => ({
				title,
				url: `${base}/agent/${title}`,
				state: agent.isConnected ? (agent.isWaiting ? 'listening' : 'busy') : 'disconnected'
			}))
	);

	let threads = $derived(
		ctx.session &&
			Object.values(ctx.session.threads).map((thread) => ({
				id: thread.id,
				title: thread.name,
				url: `${base}/thread/${thread.id}`,
				badge: thread.unread
			}))
	);

	let value = $state('');
</script>

<Command.Dialog bind:open>
	<Command.Input placeholder="Type a command or search..." bind:value />
	<Command.List>
		<Command.Empty>No results found.</Command.Empty>
		<Command.Group heading="Quick Actions">
			<Command.Item keywords={['new']}
				>Create session
				<Command.Shortcut>SHIFT N</Command.Shortcut>
			</Command.Item>
			<Command.Item>Add server</Command.Item>
			<Command.Item
				>Refresh agent config
				<Command.Shortcut>SHIFT R</Command.Shortcut>
			</Command.Item>
			<Command.Item
				onSelect={() => {
					(debugMenu = true), (open = false);
				}}
				>Debug tools
				<Command.Shortcut>SHIFT D</Command.Shortcut></Command.Item
			>
		</Command.Group>
		<Command.Group heading="Pages">
			<Command.LinkItem href="{base}/tools/user-input">User input</Command.LinkItem>
			<Command.LinkItem href="{base}/registry">Agent registry</Command.LinkItem>
			<Command.LinkItem href="{base}/logs">Logs</Command.LinkItem>
			<Command.LinkItem href="{base}/statistics">Statistics</Command.LinkItem>
		</Command.Group>
		<Command.Group heading="Threads">
			{#each threads ?? [] as thread}
				<Command.Item onSelect={() => (goto(thread.url), (open = false))}>
					<IconChats />
					<span class="truncate">{thread.title}</span>
				</Command.Item>
			{/each}
		</Command.Group>
		<Command.Group heading="Agents">
			{#each agents ?? [] as agent}
				<Command.Item onSelect={() => (goto(agent.url), (open = false))}>
					<IconRobot />
					<span class="truncate">{agent.title}</span>
					<span class="ml-2 text-xs opacity-60">({agent.state})</span>
				</Command.Item>
			{/each}
		</Command.Group>
		<Command.Group heading="Sessions">
			{#if ctx.server.sessions.length > 0}
				{#each ctx.server.sessions as session}
					<Command.Item
						onSelect={() => {
							ctx.session = new Session({
								session,
								namespace: ctx.server.namespace,
								server: ctx.server
							});
							open = false;
						}}
					>
						<span class="truncate">{session}</span>
					</Command.Item>
				{/each}
			{/if}
		</Command.Group>
	</Command.List>
</Command.Dialog>

<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Command from '$lib/components/ui/command';
	import { Input } from '$lib/components/ui/input';
	import { Session } from '$lib/session.svelte';
	import IconChats from 'phosphor-icons-svelte/IconChatsRegular.svelte';
	import IconRobot from 'phosphor-icons-svelte/IconRobotRegular.svelte';

	let { sessCtx, agents, threads } = $props();

	let open = $state(false);
	let value = $state('');

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			open = true;
		}
	}
</script>

<svelte:document onkeydown={handleKeydown} />

<Command.Dialog bind:open>
	<Command.Input placeholder="Type a command or search..." bind:value />
	<Command.List>
		<Command.Empty>No results found.</Command.Empty>
		<Command.Group heading="Quick Actions">
			<Command.Item keywords={['new']}>Create session</Command.Item>
			<Command.Item>Add server</Command.Item>
			<Command.Item>Refresh agent config</Command.Item>
		</Command.Group>
		<Command.Group heading="Pages">
			<Command.LinkItem href="/tools/user-input">User input</Command.LinkItem>
			<Command.LinkItem href="/registry">Agent registry</Command.LinkItem>
			<Command.LinkItem href="/logs">Logs</Command.LinkItem>
			<Command.LinkItem href="/statistics">Statistics</Command.LinkItem>
		</Command.Group>
		<Command.Group heading="Threads">
			{#each threads as thread}
				<Command.Item onSelect={() => (goto(thread.url), (open = false))}>
					<IconChats />
					<span class="truncate">{thread.title}</span>
				</Command.Item>
			{/each}
		</Command.Group>
		<Command.Group heading="Agents">
			{#each agents as agent}
				<Command.Item onSelect={() => (goto(agent.url), (open = false))}>
					<IconRobot />
					<span class="truncate">{agent.title}</span>
					<span class="ml-2 text-xs opacity-60">({agent.state})</span>
				</Command.Item>
			{/each}
		</Command.Group>
		<Command.Group heading="Sessions">
			{#if sessCtx.sessions && sessCtx.sessions.length > 0}
				{#each sessCtx.sessions as session}
					<Command.Item
						onSelect={() => {
							if (!sessCtx.connection) return;
							sessCtx.session = new Session({ ...sessCtx.connection, session });
							open = false;
						}}
					>
						<span class="truncate">{session}</span>
					</Command.Item>
				{/each}
			{/if}
		</Command.Group>
		<Command.Group heading="Servers">
			<!-- {#if sessCtx.sessions && sessCtx.sessions.length > 0}
				{#each sessCtx.sessions as session}
					<Command.Item
						onSelect={() => {
							if (!sessCtx.connection) return;
							sessCtx.session = new Session({ ...sessCtx.connection, session });
							open = false;
						}}
					>
						<span class="truncate">{session}</span>
					</Command.Item>
				{/each}
			{/if} -->
		</Command.Group>
	</Command.List>
</Command.Dialog>

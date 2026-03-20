<script lang="ts">
	import type { components } from '$generated/api';
	import type { Session } from '$lib/session.svelte';

	import { Input } from '@coral-os/component-library/ui/input/index.js';
	import { Button } from '@coral-os/component-library/ui/button/index.js';
	import * as Select from '@coral-os/component-library/ui/select/index.js';

	import { appContext } from '$lib/context';
	import { toast } from 'svelte-sonner';

	let ctx = appContext.get();

	const {
		agent,
		session
	}: {
		agent: components['schemas']['SessionAgentState'];
		session: Session;
	} = $props();

	let otherAgents = $derived(
		Object.values(session.agents)
			.map((a) => a.name)
			.filter((name) => name !== agent.name)
	);

	let participantNames = $state<string[]>([]);
	let threadName = $state('');

	async function createThread() {
		try {
			await ctx.server.createThread(session.sessionId, agent.name, {
				threadName: threadName,
				participantNames
			});

			participantNames = [];
			threadName = '';

			toast.success('Thread created');
		} catch (e) {
			toast.error(`${e}`);
		}
	}
</script>

<p>Thread title:</p>
<Input placeholder="Enter thread name..." bind:value={threadName} />

<p>Participants:</p>
<Select.Root type="multiple" disabled={otherAgents.length === 0} bind:value={participantNames}>
	<Select.Trigger class="w-[280px]"
		>{participantNames.length === 0
			? 'Select participants'
			: `Participants: ${participantNames.join(', ')}`}</Select.Trigger
	>

	<Select.Content>
		{#each otherAgents as participant}
			<Select.Item value={participant}>{participant}</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>

<Button disabled={threadName === ''} onclick={createThread}>Create thread</Button>

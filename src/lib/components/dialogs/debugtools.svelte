<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Button from '../ui/button/button.svelte';
	import { invalidateAll, goto } from '$app/navigation';
	import { applyAction, deserialize, enhance } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';
	import { Input } from '$lib/components/ui/input/index.js';
	import { toast } from 'svelte-sonner';
	import * as Card from '../ui/card';

	let { open = $bindable(false) } = $props();

	async function testInputTool() {
		const res = await fetch(`/api/mcp-tools/user-input-request/${sessionId}/${agentName}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ message: message })
		});
		return res;
	}

	let message = $state('Test message from debug tools');
	let agentName = $state('Agent');
	let sessionId = $state(crypto.randomUUID());
</script>

<Dialog.Root bind:open>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Debug tools</Dialog.Title>
			<Dialog.Description>
				Tools and utilities for debugging and development purposes.
			</Dialog.Description>
			<Button>Quick Session</Button>
		</Dialog.Header>
		<ol>
			<li>
				<Card.Root>
					<Card.Header>
						<Card.Title>Input tool tester</Card.Title>
						<Card.Description
							>Sends a request to the user input tool endpoint to simulate user input requests.</Card.Description
						>
					</Card.Header>
					<Card.Content>
						<label>
							Session ID
							<Input name="sessionid" type="text" bind:value={sessionId} />
						</label>
						<label>
							Agent Name
							<Input name="agentname" type="text" bind:value={agentName} />
						</label>
						<label>
							Message
							<Input name="message" type="text" bind:value={message} />
						</label>
					</Card.Content>
					<Card.Footer>
						<Button
							onclick={() => {
								toast.info('Sent request to user input tool endpoint');
								testInputTool();
							}}>Send request</Button
						>
					</Card.Footer>
				</Card.Root>
			</li>
			<li>Thread creator</li>
			<li></li>
		</ol>
	</Dialog.Content>
</Dialog.Root>

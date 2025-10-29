<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Button from '../ui/button/button.svelte';
	import { invalidateAll, goto } from '$app/navigation';
	import { applyAction, deserialize } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';
	import { Input } from '$lib/components/ui/input/index.js';

	let { open = $bindable(false) } = $props();

	async function testInputTool() {
		const res = await fetch(`/api/mcp-tools/user-input-request/${sessionId}/${agentName}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ input: 'Sample input for testing' })
		});
	}

	async function handleSubmit(
		event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }
	) {
		event.preventDefault();
		const data = new FormData(event.currentTarget, event.submitter);

		const response = await fetch(event.currentTarget.action, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ input: 'Sample input for testing' })
		});

		const result: ActionResult = deserialize(await response.text());

		if (result.type === 'success') {
			// rerun all `load` functions, following the successful update
			await invalidateAll();
		}

		applyAction(result);
	}

	let address = $state('localhost:5173');
	let message = $state('test');
	let agentName = $state('Debug Agent');
	let sessionId = $state(crypto.randomUUID());
</script>

<Dialog.Root bind:open>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Debug tools</Dialog.Title>
			<Dialog.Description>
				Tools and utilities for debugging and development purposes.
			</Dialog.Description>
		</Dialog.Header>
		<ol>
			<li>
				Input tool tester
				<form
					method="POST"
					action={`/api/mcp-tools/user-input-request/${sessionId}/${agentName}`}
					class="mt-2 flex flex-col gap-2"
				>
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
					<button>Send</button>
				</form>
			</li>
			<li>Thread creator</li>
			<li></li>
		</ol>
	</Dialog.Content>
</Dialog.Root>

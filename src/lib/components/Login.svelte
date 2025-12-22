<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { appContext } from '$lib/context';

	let ctx = appContext.get();

	let token = $state('');

	let { open = $bindable(false) } = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Enter token to login</Dialog.Title>
			<Dialog.Description>
				<form
					bind:this={form}
					class="m-auto flex w-md flex-col items-center gap-4"
					method="POST"
					action="/api/v1/auth/token"
					use:enhance={() => {
						return async ({ result }) => {
							open = false;
							invalidateAll();
							await ctx.server.fetchAll();
							ctx.server.alive = true;
						};
					}}
				>
					<Field.Set class="w-full">
						<Field.Group>
							<Field.Field>
								<Field.Label for="token">Access token</Field.Label>
								<Input id="token" type="password" name="token" bind:value={token} />
							</Field.Field>
						</Field.Group>
					</Field.Set>
					<Field.Field orientation="horizontal" class="flex justify-between">
						<Button variant="outline" type="button" href="https://docs.coralprotocol.org/"
							>Help</Button
						>
						<Button type="submit">Enter</Button>
					</Field.Field>
				</form>
			</Dialog.Description>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>

<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Textarea } from '$lib/components/ui/textarea';
	import Button from '$lib/components/ui/button/button.svelte';

	import type { Snippet } from 'svelte';

	let {
		onImport,
		child
	}: { onImport?: (value: string) => void; child?: Snippet<[{ props: Record<string, unknown> }]> } =
		$props();

	let value = $state('');
	let open = $state(false);
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger {child}>Import from clipboard</Dialog.Trigger>
	<Dialog.Content class="">
		<Dialog.Header>
			<Dialog.Title>Import from clipboard</Dialog.Title>
		</Dialog.Header>
		<Textarea bind:value autocomplete="off" class="max-h-[80svh] min-h-60" />
		<Button
			onclick={() => {
				onImport?.(value);
				value = '';
				open = false;
			}}>Import</Button
		>
	</Dialog.Content>
</Dialog.Root>

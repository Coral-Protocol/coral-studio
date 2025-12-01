<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Textarea } from '$lib/components/ui/textarea';
	import Button from '$lib/components/ui/button/button.svelte';
	import { toast } from 'svelte-sonner';

	import type { Snippet } from 'svelte';

	let {
		onImport,
		child,
		asJson = ''
	}: {
		onImport?: (value: string) => void;
		child?: Snippet<[{ props: Record<string, unknown> }]>;
		asJson?: string;
	} = $props();

	let value = $state('');
	let open = $state(false);
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger {child}>Edit Raw</Dialog.Trigger>
	<Dialog.Content class="">
		<Dialog.Header>
			<Dialog.Title>Session JSON</Dialog.Title>
		</Dialog.Header>
		<Textarea
			bind:value={asJson}
			autocomplete="off"
			class="max-h-[80svh] min-h-60"
			spellcheck="false"
		/>
		<Dialog.Footer>
			<Button
				variant="outline"
				class="w-fit"
				onclick={() => {
					navigator.clipboard.writeText(asJson);
					toast.success('Session JSON copied to clipboard');
				}}
			>
				Copy
			</Button>
			<Button
				class="w-fit"
				onclick={() => {
					onImport?.(asJson);
					open = false;
					toast.success('Session updated from JSON');
				}}>Save</Button
			>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

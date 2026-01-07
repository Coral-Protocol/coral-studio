<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import type { Snippet } from 'svelte';
	import Button, { type ButtonProps } from './ui/button/button.svelte';

	const {
		onclick,
		children,
		...props
	}: Omit<ButtonProps, 'onclick'> & { children?: Snippet; onclick?: () => void } = $props();

	let open = $state(false);
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger>
		{#snippet child({ props: childProps })}
			<Button
				{...childProps}
				{...props}
				onclick={(e) => {
					if (e.shiftKey) {
						e.preventDefault();
						onclick?.();
					} else {
						open = true;
					}
				}}
			>
				{@render children?.()}
			</Button>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-xs">
		<Dialog.Header>
			<Dialog.Title>Are you sure you want to remove this agent?</Dialog.Title>
			<Dialog.Description>
				<p class="mx-auto p-4 text-xs">
					Tip: Shift-click remove to skip this confirmation.
				</p></Dialog.Description
			>
		</Dialog.Header>

		<section class="flex w-full justify-between gap-2">
			<Button
				class="grow"
				variant="destructive"
				onclick={() => {
					onclick?.();
					open = false;
				}}>Yes</Button
			>
			<Button
				class="grow"
				variant="secondary"
				onclick={() => {
					open = false;
				}}>No</Button
			>
		</section>
	</Dialog.Content>
</Dialog.Root>

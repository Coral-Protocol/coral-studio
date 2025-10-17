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
			<Dialog.Title>Are you sure?</Dialog.Title>
			<Dialog.Description></Dialog.Description>
		</Dialog.Header>

		<Button
			onclick={() => {
				onclick?.();
				open = false;
			}}>Yes</Button
		>
		<Button
			variant="secondary"
			onclick={() => {
				open = false;
			}}>No</Button
		>
	</Dialog.Content>
</Dialog.Root>

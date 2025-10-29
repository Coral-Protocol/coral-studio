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
			<Dialog.Description class="text-sm">Hold shift to skip this check</Dialog.Description>
		</Dialog.Header>

		<section class="flex w-full justify-between gap-2">
			<Button
				class="grow"
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

<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import type { Snippet } from 'svelte';
	import Button, { type ButtonProps } from './ui/button/button.svelte';

	const {
		onclick,
		children,
		title = 'Are you sure?',
		smallText = true,
		detail = 'Holding shift while clicking will bypass this confirmation.',
		...props
	}: Omit<ButtonProps, 'onclick'> & {
		children?: Snippet;
		title?: string;
		detail?: string;
		smallText?: boolean;
		onclick?: () => void;
	} = $props();

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
			<Dialog.Title>{title}</Dialog.Title>
			<Dialog.Description>
				<p class="mx-auto py-4 {smallText ? 'text-xs' : ''}">
					{detail}
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
				onclick={() => {
					open = false;
				}}>No</Button
			>
		</section>
	</Dialog.Content>
</Dialog.Root>

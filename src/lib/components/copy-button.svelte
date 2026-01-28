<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { cn } from '$lib/utils';
	import { buttonVariants } from './ui/button';
	import type { TooltipTriggerProps } from 'bits-ui';
	import { UseClipboard } from '$lib/hooks/use-clipboard.svelte';

	import IconCopy from 'phosphor-icons-svelte/IconCopyRegular.svelte';
	import IconCheck from 'phosphor-icons-svelte/IconCheckRegular.svelte';

	let { class: className, value, ...props }: TooltipTriggerProps & { value?: string } = $props();

	let clipboard = new UseClipboard();
</script>

<Tooltip.Provider>
	<Tooltip.Root>
		<Tooltip.Trigger
			disabled={!value}
			class={cn(buttonVariants({ size: 'icon' }), className)}
			onclick={() => {
				value && clipboard.copy(value);
			}}
			{...props}
		>
			{#if clipboard.copied}
				<IconCheck />
			{:else}
				<IconCopy />
			{/if}
		</Tooltip.Trigger>
		<Tooltip.Content>Copy to clipboard</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>

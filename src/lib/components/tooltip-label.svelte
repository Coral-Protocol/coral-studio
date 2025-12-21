<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Label } from '$lib/components/ui/label';
	import type { Snippet } from 'svelte';

	const {
		tooltip,
		type,
		required,
		title,
		class: className,
		children: labelChild
	}: {
		tooltip?: string;
		type?: string;
		title?: string;
		required?: boolean;
		class?: string;
		children?: Snippet;
	} = $props();
</script>

<Tooltip.Provider>
	<Tooltip.Root disabled={!tooltip} delayDuration={100} disableHoverableContent>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<Label {...props} class="{className} !m-0 ">
					{@render labelChild?.()}
				</Label>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content class="flex w-fit max-w-96 flex-col gap-2 wrap-break-word ">
			{#if title}
				<p class="font-bold">{title}</p>
			{/if}
			<p>{tooltip}</p>
			{#if type}
				<p><span class="font-bold">type:</span> {type}</p>
			{/if}
			{#if required}
				<p class="font-bold">required</p>
			{/if}
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>

<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Label } from '$lib/components/ui/label';
	import type { Snippet } from 'svelte';

	const {
		tooltip,
		class: className,
		children: labelChild
	}: { tooltip?: string; class?: string; children?: Snippet } = $props();
</script>

<Tooltip.Provider>
	<Tooltip.Root disabled={!tooltip} delayDuration={100}>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<Label {...props} class={className}>
					{@render labelChild?.()}
				</Label>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content>
			<p>{tooltip}</p>
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>

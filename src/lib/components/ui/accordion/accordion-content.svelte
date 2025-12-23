<script lang="ts">
	import { Accordion as AccordionPrimitive } from 'bits-ui';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { cn, type WithoutChild } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		separator = false,
		children,
		...restProps
	}: WithoutChild<AccordionPrimitive.ContentProps> & {
		separator?: boolean;
	} = $props();
</script>

<AccordionPrimitive.Content
	bind:ref
	data-slot="accordion-content"
	class="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down bg-sidebar/80 overflow-hidden text-sm"
	{...restProps}
>
	<div class={cn('pt-0 ', className)}>
		{#if separator}
			<Separator class="from-accent to-secondary mb-4 bg-gradient-to-r" />
		{/if}

		{@render children?.()}
	</div>
</AccordionPrimitive.Content>

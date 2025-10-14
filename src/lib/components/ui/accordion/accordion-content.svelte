<script lang="ts">
	import { Accordion as AccordionPrimitive } from 'bits-ui';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { cn, type WithoutChild } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChild<AccordionPrimitive.ContentProps> = $props();
</script>

<AccordionPrimitive.Content
	bind:ref
	data-slot="accordion-content"
	class="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
	{...restProps}
>
	<div class={cn('pt-0 pb-4', className)}>
		<Separator class="from-accent to-secondary mb-4 bg-gradient-to-r" />
		{@render children?.()}
	</div>
</AccordionPrimitive.Content>

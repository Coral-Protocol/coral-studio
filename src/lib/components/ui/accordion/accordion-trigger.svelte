<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';
	import { cn, type WithoutChild } from '$lib/utils.js';
	import { Accordion as AccordionPrimitive } from 'bits-ui';

	export const accordionTriggerVariants = tv({
		base: `
			focus-visible:border-ring
			focus-visible:ring-ring/50
			flex flex-1 items-start justify-between gap-4
			rounded-md  text-left font-medium
			transition-all outline-none
			focus-visible:ring-[3px] bg-sidebar
			disabled:pointer-events-none disabled:opacity-50
			[&[data-state=open]>svg]:rotate-180
			p-4
		`,
		variants: {
			variant: {
				default: 'text-lg hover:underline',
				compact: 'text-lg rounded-none hover:bg-sidebar-accent hover:text-primary'
			}
		},
		defaultVariants: {
			variant: 'default'
		}
	});

	export const accordionIconVariants = tv({
		base: `
			pointer-events-none shrink-0 translate-y-0.5
			transition-transform duration-200
		`,
		variants: {
			variant: {
				default: 'text-primary bg-accent size-6 rounded-full p-1',
				compact: 'text-muted-foreground size-6 rounded-none'
			}
		},
		defaultVariants: {
			variant: 'default'
		}
	});

	export type AccordionTriggerVariant = VariantProps<typeof accordionTriggerVariants>['variant'];

	export type AccordionTriggerProps = WithoutChild<AccordionPrimitive.TriggerProps> & {
		level?: AccordionPrimitive.HeaderProps['level'];
		variant?: AccordionTriggerVariant;
	};
</script>

<script lang="ts">
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	let {
		ref = $bindable(null),
		class: className,
		level = 3,
		variant = 'default',
		children,
		...restProps
	}: AccordionTriggerProps = $props();
</script>

<AccordionPrimitive.Header {level} class="flex">
	<AccordionPrimitive.Trigger
		data-slot="accordion-trigger"
		bind:ref
		class={cn(accordionTriggerVariants({ variant }), className)}
		{...restProps}
	>
		{@render children?.()}
		<ChevronDownIcon class={accordionIconVariants({ variant })} />
	</AccordionPrimitive.Trigger>
</AccordionPrimitive.Header>

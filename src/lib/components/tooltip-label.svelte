<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Label } from '$lib/components/ui/label';
	import type { Snippet } from 'svelte';
	import type { string } from 'zod';

	const {
		tooltip,
		extra,
		type,
		required,
		title,
		class: className,
		children: labelChild
	}: {
		extra?: Record<string, ExtraValue>;
		tooltip?: string;
		type?: string;
		title?: string;
		required?: boolean;
		class?: string;
		children?: Snippet;
	} = $props();

	type ExtraValue =
		| true
		| string
		| {
				value: string | true;
				showKey?: boolean;
		  };
</script>

<Tooltip.Provider>
	<Tooltip.Root disabled={!tooltip} delayDuration={100} disableHoverableContent>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<Label
					{...props}
					class="{className} relative !m-0 inline w-full cursor-help content-center truncate hover:min-w-max "
				>
					<span class="flex items-center overflow-hidden">
						<span class="truncate">
							{@render labelChild?.()}
						</span>

						{#if extra && extra.required === true}
							<span class="text-accent ml-1 flex-shrink-0 select-none">*</span>
						{/if}
					</span>
				</Label>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content class="flex w-fit max-w-96 flex-col gap-2 wrap-break-word ">
			{#if title}
				<p class="font-bold">{title}</p>
			{/if}
			{#if tooltip}
				<p>{tooltip}</p>
			{/if}
			{#if extra}
				{#each Object.entries(extra) as [key, item]}
					{#if item === true}
						<p><span class="font-bold">{key}</span></p>
					{:else if typeof item === 'string'}
						<p><span class="font-bold">{key}:</span> {item}</p>
					{:else}
						<p>
							{#if item.showKey !== false}
								<span class="font-bold">{key}:</span>
							{/if}
							{item.value === true ? '' : item.value}
						</p>
					{/if}
				{/each}
			{/if}
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>

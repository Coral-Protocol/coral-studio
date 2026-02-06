<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import { Button, buttonVariants } from '$lib/components/ui/button';

	import { cn } from '$lib/utils';

	import type { OptionProps } from '../Option.svelte';

	type Props = OptionProps<'bool'>;

	let { meta, value, props }: Props = $props();
</script>

{#if ($value ?? meta.default) !== undefined}
	<ButtonGroup.Root {...props} class="m-0 justify-start">
		<Button
			class={cn(($value ?? meta.default) === true && 'bg-accent text-accent-foreground')}
			onclick={() => {
				$value = true;
			}}>True</Button
		>
		<Button
			class={cn(($value ?? meta.default) === false ? 'bg-accent text-accent-foreground' : '')}
			onclick={() => {
				$value = false;
			}}>False</Button
		>
	</ButtonGroup.Root>
{/if}
<!-- {#if $errors}<span class="invalid">{$errors}</span>{/if} -->

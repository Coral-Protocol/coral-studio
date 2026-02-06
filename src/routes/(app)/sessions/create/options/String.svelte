<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';

	import type { OptionProps } from '../Option.svelte';

	type Props = OptionProps<'string' | 'secret'>;

	let { meta, value, props }: Props = $props();
	let isSecret = $derived(meta.type === 'secret' ? true : meta.secret);
</script>

{#if meta.display?.multiline === true}
	<Textarea
		{...props}
		class="relative m-0 h-16 resize-y"
		bind:value={$value}
		defaultValue={meta.default}
	/>
{:else}
	<Input
		{...props}
		type={isSecret ? 'password' : 'string'}
		bind:value={$value}
		class="m-0 w-full"
		defaultValue={meta.default}
		aria-invalid={(() => {
			return undefined;
			// FIXME: error prop
			// const error = $errors?.agents?.[selectedAgent!]?.options?.[name];
			// if (error && JSON.stringify(error).includes('{}')) return undefined;
			// else if (error) return true;
			// else return undefined;
		})()}
	/>
{/if}

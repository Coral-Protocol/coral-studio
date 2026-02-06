<script lang="ts">
	import { Input } from '$lib/components/ui/input';

	import type { OptionProps } from '../Option.svelte';

	type Props = OptionProps<
		'number' | 'i8' | 'i16' | 'i32' | 'i64' | 'u8' | 'u16' | 'u32' | 'u64' | 'f32' | 'f64'
	>;

	let { meta, value, props }: Props = $props();
</script>

<Input
	{...props}
	type="file"
	bind:value={$value}
	class="m-0"
	aria-invalid={(() => {
		return undefined;
		// FIXME: error prop
		// const error = $errors?.agents?.[selectedAgent!]?.options?.[name];
		// if (error && JSON.stringify(error).includes('{}')) return undefined;
		// else if (error) return true;
		// else return undefined;
	})()}
	placeholder={meta.default?.toString()}
/>

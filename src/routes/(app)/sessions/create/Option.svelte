<script lang="ts" module>
	import type { z } from 'zod';
	import * as schemas from './schemas';
	import type { ControlAttrs } from 'formsnap';

	type Schema = z.output<schemas.FormSchema>;

	type Option = NonNullable<Schema['agents'][number]['options'][string]>;
	export type OptionTypes = NonNullable<Option['type']>;

	export type Expand<T> = T extends infer U
		? {
				[K in keyof U]: U[K];
			}
		: never;
	export type OptionProps<Type extends OptionTypes = OptionTypes> = {
		meta: Extract<components['schemas']['RegistryAgent']['options'][string], { type: Type }>;
		type: Type;
		value: store.Writable<Extract<Option, { type: Type }>['value'] | undefined>;
		props: Expand<ControlAttrs>;
	};
</script>

<script lang="ts">
	// import * as schemas from './schemas';

	import type { Component } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import * as store from 'svelte/store';
	import {
		formFieldProxy,
		type SuperForm,
		type FormPathLeaves,
		type FormFieldProxy,
		type FormPath
	} from 'sveltekit-superforms';

	import * as Form from '$lib/components/ui/form';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import { Button, buttonVariants } from '$lib/components/ui/button';

	import IconArrowUUpLeft from 'phosphor-icons-svelte/IconArrowUUpLeftRegular.svelte';

	import { cn } from '$lib/utils';

	import type { components } from '$generated/api';
	import Bool from './options/Bool.svelte';
	import TooltipLabel from '$lib/components/tooltip-label.svelte';
	import String from './options/String.svelte';
	import Number from './options/Number.svelte';
	import Blob from './options/Blob.svelte';

	type Props = {
		superform: SuperForm<Schema>;
		agent: number;
		name: string;
		meta: components['schemas']['RegistryAgent']['options'][string];
	};

	let { superform: form, agent, name, meta, ...rest }: Props = $props();
	const { form: formData, errors } = form;

	let type = $derived(meta.type);
	let value = $derived(
		store.toStore(
			() => {
				return $formData.agents[agent]?.options[name]?.value;
			},
			(value) => {
				if (!$formData.agents[agent]) return;
				$formData.agents[agent].options[name] = { type, value } as any; // Safety: trust me
			}
		)
	);

	const componentMap: {
		[K in OptionTypes]: Component<any> | undefined;
	} = {
		string: String,
		secret: String,

		bool: Bool,
		blob: Blob,

		number: Number,
		i8: Number,
		i16: Number,
		i32: Number,
		i64: Number,
		u8: Number,
		u16: Number,
		u32: Number,
		u64: Number,
		f32: Number,
		f64: Number,

		'list[blob]': undefined,
		'list[i8]': undefined,
		'list[i16]': undefined,
		'list[i32]': undefined,
		'list[i64]': undefined,
		'list[u8]': undefined,
		'list[u16]': undefined,
		'list[u32]': undefined,
		'list[u64]': undefined,
		'list[f32]': undefined,
		'list[f64]': undefined,
		'list[string]': undefined
	};
</script>

<Form.ElementField
	class="grid grid-cols-[1fr_3fr] gap-2"
	{form}
	name="agents[{agent}].options.{name}.value"
>
	<Form.Control>
		{#snippet children({ props })}
			<TooltipLabel
				class="max-w-1/4 min-w-1/4 {meta.required ? 'hover:pr-[0.5em]' : ''}"
				title={name}
				for={props.id}
				tooltip={meta.display?.description ?? 'No description provided.'}
				extra={{
					required: meta.required ?? false,
					type: meta.type
				}}
			>
				{meta.display?.label ?? name}
			</TooltipLabel>
			{#if type}
				{@const O = componentMap[type] as Component<OptionProps>}
				{#if O}
					<O {type} {props} {value} {meta} />
				{:else}
					hmm: {type}
				{/if}
			{/if}
		{/snippet}
	</Form.Control>
</Form.ElementField>
<!-- {#if $errors}<span class="invalid">{$errors}</span>{/if} -->

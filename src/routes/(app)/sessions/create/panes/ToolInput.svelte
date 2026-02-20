<script lang="ts">
	import * as schemas from '../schemas';
	import type { z } from 'zod';
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
	import { Input } from '$lib/components/ui/input';

	type T = z.output<schemas.FormSchema>;

	type Props = HTMLInputAttributes & {
		superform: SuperForm<T>;
		// field: FormPath<T>;
		id: string;
	};

	let { superform: form, id, ...rest }: Props = $props();
	const { form: formData, errors } = form;
	let data = $derived(
		store.toStore(
			() => $formData.tools[id],
			(tool) => {
				if (!tool) return;
				$formData.tools[id] = tool;
			}
		)
	);
</script>

{#if $data}
	<Form.Field {form} name="tools.{id}.name">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Name</Form.Label>
				<Input {...props} bind:value={$data.name} />
			{/snippet}
		</Form.Control>
		<Form.Description
			>The name of the tool. This is NOT shown to the agents themselves.</Form.Description
		>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="tools.{id}.schema.name">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>MCP Name</Form.Label>
				<Input {...props} bind:value={$data.schema.name} placeholder={$data.name} />
			{/snippet}
		</Form.Control>
		<Form.Description
			>The name of the tool, as seen by agents. Defaults to the tool name</Form.Description
		>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="tools.{id}.transport.url">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>URL</Form.Label>
				<Input
					{...props}
					bind:value={$data.transport.url}
					placeholder="http://my-app.com/api/custom-tools/my-tool"
				/>
			{/snippet}
		</Form.Control>
		<Form.Description
			>The URL the server sends a POST request to, to get a response for the MCP tool call.</Form.Description
		>
		<Form.FieldErrors />
	</Form.Field>
{/if}
<!-- {#if $errors}<span class="invalid">{$errors}</span>{/if} -->

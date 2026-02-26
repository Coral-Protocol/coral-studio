<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import * as Select from '$lib/components/ui/select';

	import Input from '$lib/components/ui/input/input.svelte';
	import { Spinner } from '$lib/components/ui/spinner';

	import Combobox from '$lib/components/combobox.svelte';
	import TooltipLabel from '$lib/components/tooltip-label.svelte';
	import OptionField from '../OptionField.svelte';

	import { createSessionContext } from '../+page.svelte';
	import { appContext } from '$lib/context';
	import { registryIdOf } from '$lib/CoralServer.svelte';
	import { tick } from 'svelte';

	let appCtx = appContext.get();

	let ctx = createSessionContext.get();
	let form = $derived(ctx.form);
	let formData = $derived(ctx.formData);

	let curAgent = $derived(
		ctx.selectedAgent !== null ? $formData.agents[ctx.selectedAgent] : undefined
	);
	let curCatalog = $derived(
		curAgent && appCtx.server.catalogs[registryIdOf(curAgent.id.registrySourceId)]
	);

	const UNGROUPED = '__ungrouped';

	let groupedOptions = $derived(
		Object.entries(ctx.detailedAgent?.registryAgent?.options ?? {}).reduce<
			Record<string, [string, any][]>
		>((acc, [name, opt]) => {
			const group = opt?.display?.group ?? UNGROUPED;
			(acc[group] ??= []).push([name, opt]);
			return acc;
		}, {})
	);
</script>

{#if ctx.selectedAgent !== null && curAgent && curCatalog}
	{#if !ctx.detailedAgent}
		<Spinner class="m-auto my-8" />
	{:else}
		<header class="flex flex-col gap-2 px-4">
			<Form.ElementField
				{form}
				name="agents[{ctx.selectedAgent}].name"
				class="flex items-center gap-2"
			>
				<Form.Control>
					{#snippet children({ props })}
						<TooltipLabel tooltip={'Name of the agent in this session'} class="m-0 max-w-1/4"
							>Name
						</TooltipLabel>
						<Input {...props} bind:value={$formData.agents[ctx.selectedAgent!]!.name} />
					{/snippet}
				</Form.Control>
			</Form.ElementField>
			<Form.ElementField
				{form}
				name="agents[{ctx.selectedAgent}].description"
				class="flex items-center gap-2"
			>
				<Form.Control>
					{#snippet children({ props })}
						<TooltipLabel tooltip={'Optional agent description'} class="m-0 max-w-1/4"
							>Description
						</TooltipLabel>
						<Input {...props} bind:value={$formData.agents[ctx.selectedAgent!]!.description} />
					{/snippet}
				</Form.Control>
			</Form.ElementField>
			<Form.ElementField
				{form}
				name="agents[{ctx.selectedAgent}].id.version"
				class="flex items-center gap-2"
			>
				<Form.Control>
					{#snippet children({ props })}
						{@const id = curAgent.id}
						{@const reg = curCatalog.agents[id.name]!}

						<TooltipLabel
							tooltip={'Version to use from the server agent registry'}
							class="w m-0 max-w-1/4 truncate">Version</TooltipLabel
						>
						<Combobox
							{...props}
							class="w-auto grow pr-[2px] "
							side="right"
							align="start"
							disabled={reg.versions.length <= 1}
							bind:selected={() => id.version, () => {}}
							options={[{ items: reg.versions }]}
							searchPlaceholder="Search versions..."
							onValueChange={(value: string) => {
								$formData.agents[ctx.selectedAgent!]!.id.version = value;
								$formData.agents = $formData.agents;
								tick().then(() => {
									// for (const name in $formData.agents[ctx.selectedAgent!]!.options) {
									// 	if (!(name in availableOptions)) {
									// 		delete $formData.agents[ctx.selectedAgent!]!.options[name];
									// 	}
									// }
									$formData.agents = $formData.agents;
								});
							}}
						/>
					{/snippet}
				</Form.Control>
			</Form.ElementField>

			<Form.ElementField
				{form}
				name="agents[{ctx.selectedAgent}].provider.runtime"
				class="flex items-center gap-2"
			>
				<Form.Control>
					{#snippet children({ props })}
						{@const runtime = $formData.agents[ctx.selectedAgent!]!.provider.runtime}
						{@const items = Object.keys(ctx.detailedAgent?.registryAgent?.runtimes ?? {})}
						<TooltipLabel
							tooltip={'Will only show available options for the selected agent type'}
							class="m-0 max-w-1/4">Runtime</TooltipLabel
						>
						<Combobox
							{...props}
							class="w-auto grow pr-[2px]"
							side="right"
							align="start"
							disabled={items.length <= 1}
							options={[
								{
									items
								}
							]}
							searchPlaceholder="Search runtimes..."
							bind:selected={
								() => runtime || Object.keys(ctx.detailedAgent?.registryAgent?.runtimes ?? {})[0],
								() => {}
							}
							onValueChange={(selected: string) => {
								$formData.agents[ctx.selectedAgent!]!.provider.runtime = selected as any;
							}}
						/>
					{/snippet}
				</Form.Control>
			</Form.ElementField>
			<Form.ElementField
				{form}
				name="agents[{ctx.selectedAgent}].provider.runtime"
				class="flex items-center gap-2"
			>
				<Form.Control>
					{#snippet children({ props })}
						{@const tools = $formData.agents[ctx.selectedAgent!]!.customToolAccess}
						<TooltipLabel
							tooltip={'What custom tools this agent has access to.'}
							class="m-0 max-w-1/4">Custom Tools</TooltipLabel
						>
						<Select.Root
							{...props}
							type="multiple"
							value={Array.from(tools.keys())}
							onValueChange={(value) => {
								if (ctx.selectedAgent === null || !$formData.agents[ctx.selectedAgent]) return;
								$formData.agents[ctx.selectedAgent!]!.customToolAccess = new Set(value);
								$formData.agents = $formData.agents;
							}}
						>
							<Select.Trigger class="m-0">
								<span>{tools.size} tools</span>
							</Select.Trigger>
							<Select.Content>
								{#if Object.keys($formData.tools).length == 0}
									<span class="text-muted-foreground h-9 px-2 text-sm italic">No tools</span>
								{/if}
								{#each Object.values($formData.tools) as tool}
									<Select.Item value={tool.id}>{tool.name}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					{/snippet}
				</Form.Control>
			</Form.ElementField>
		</header>
		<ol class="border-t">
			{#each Object.entries(groupedOptions) as [group, entries]}
				<li>
					{#if group !== '__ungrouped'}
						<Accordion.Root type="multiple" value={[group]}>
							<Accordion.Item value={group}>
								<Accordion.Trigger variant="compact">
									{group}
								</Accordion.Trigger>

								<Accordion.Content class="!p-0">
									<ol>
										{#each entries as [name, opt] (name)}
											<OptionField superform={form} agent={ctx.selectedAgent!} {name} meta={opt} />
										{/each}
									</ol>
								</Accordion.Content>
							</Accordion.Item>
						</Accordion.Root>
					{:else}
						<ol>
							{#each entries as [name, opt] (name)}
								<OptionField superform={form} agent={ctx.selectedAgent!} {name} meta={opt} />
							{/each}
						</ol>
					{/if}
				</li>
			{/each}
		</ol>
	{/if}
{:else}
	<div class="text-muted-foreground m-auto h-full w-full content-center text-center">
		Add an agent to begin.
	</div>
{/if}

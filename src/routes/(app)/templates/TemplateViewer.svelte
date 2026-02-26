<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import * as Dialog from '$lib/components/ui/dialog';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import AgentGraph from '$lib/components/AgentGraph.svelte';
	import TwostepButton from '$lib/components/twostep-button.svelte';
	import * as Accordion from '$lib/components/ui/accordion';
	import type { on } from 'svelte/events';

	let {
		template = $bindable(''),
		templateData = $bindable({}),
		graphData = $bindable({}),
		open = $bindable(false),
		templates = $bindable([]),
		onRefresh = $bindable(() => {})
	}: {
		template: string;
		templateData: {
			name?: string;
			description?: string;
			data?: string;
			updated?: number;
			imported?: boolean;
		};
		graphData: { agentGraphRequest?: { agents?: any[]; groups?: any[] } };
		open: boolean;
		templates: string[];
		onRefresh: (name?: string) => void;
	} = $props();

	let loading = $state(false);

	const download = (templateName: string) => {
		try {
			const data = localStorage.getItem(`template_${templateName}`);
			if (!data) {
				throw new Error('Template data not found');
			}
			const blob = new Blob([data], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `coral-template-${templateName}.json`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Error downloading template:', error);
		}
	};

	const removeTemplate = (name: string) => {
		try {
			localStorage.removeItem(`template_${name}`);
			const index = templates.indexOf(name);
			if (index !== -1) {
				templates.splice(index, 1);
			}
			toast.success('Template removed successfully!');
			open = false;
		} catch (error) {
			console.error('Error removing template:', error);
			toast.error('Failed to remove template.');
		}
	};

	const createSessionFromTemplate = async (templateName: string) => {
		loading = true;

		try {
			if (!templateData.data) throw new Error('Template data not found');

			toast.promise(
				fetch('/api/v1/local/session', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: templateData.data
				}).then(async (res) => {
					if (!res.ok) {
						const text = await res.text();
						throw new Error(`${res.status} ${res.statusText}: ${text || 'Request failed'}`);
					}
					return res.json();
				}),
				{
					loading: 'Creating session...',
					success: 'Session created!',
					error: (err) =>
						`Failed to create session: ${err instanceof Error ? err.message : String(err)}`
				}
			);

			open = false;
		} catch (err) {
			console.error(err);
		} finally {
			loading = false;
		}
	};

	const markTrusted = (templateName: string) => {
		try {
			const data = localStorage.getItem(`template_${templateName}`);
			if (!data) {
				throw new Error('Template data not found');
			}
			const parsed = JSON.parse(data);
			parsed.imported = false;
			localStorage.setItem(`template_${templateName}`, JSON.stringify(parsed));
			templateData = parsed;
			toast.success('Template marked as trusted!');
			onRefresh(templateName);
		} catch (error) {
			console.error('Error marking template as trusted:', error);
			toast.error('Failed to mark template as trusted.');
		}
	};
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="w-fit max-w-fit min-w-fit">
		<Dialog.Header>
			<Dialog.Title class={templateData.imported ? 'text-accent' : ''}>{template}</Dialog.Title>
			<Dialog.Description>
				<ol>
					<li>Created at: {new Date(templateData.updated || 0).toLocaleString()}</li>
					<li>
						Has {graphData.agentGraphRequest?.agents?.length ?? 0} agent{graphData.agentGraphRequest
							?.agents?.length !== 1
							? 's'
							: ''} and {graphData.agentGraphRequest?.groups?.length ?? 0} group{graphData
							.agentGraphRequest?.groups?.length !== 1
							? 's'
							: ''}.
					</li>
				</ol>

				{#if templateData.imported}
					<p class="text-sm text-yellow-500">
						This template was imported externally! Please review this template before running it,
						malicious templates can cause damage.
					</p>
				{/if}

				<Separator class="my-2" />

				<section class="flex h-[400px] w-[800px] max-w-[800px] gap-2 overflow-hidden">
					<div class="bg-sidebar aspect-square w-[400px] overflow-clip rounded-lg">
						<AgentGraph
							agents={graphData.agentGraphRequest?.agents || []}
							groups={graphData.agentGraphRequest?.groups || []}
							options={{
								nodeSubLabel: null
							}}
						/>
					</div>

					<Accordion.Root
						type="single"
						value={templateData.imported ? 'item-2' : 'item-1'}
						class="aspect-square max-h-[400px] w-[400px] max-w-[400px] overflow-clip rounded-lg border"
					>
						<Accordion.Item value="item-1">
							<Accordion.Trigger class="w-[400px] grow" variant="compact"
								>Description</Accordion.Trigger
							>
							<Accordion.Content
								class="max-h-[340px] min-h-0 w-[400px] overflow-x-hidden overflow-y-scroll"
							>
								<pre>{templateData.description != ''
										? templateData.description
										: 'no description'}</pre>
							</Accordion.Content>
						</Accordion.Item>
						<Accordion.Item value="item-2" class={templateData.imported ? 'text-accent' : ''}>
							<Accordion.Trigger class=" w-[400px] grow" variant="compact">Data</Accordion.Trigger>
							<Accordion.Content class="max-h-[280px] min-h-0 grow overflow-y-scroll">
								<pre>{templateData.data}</pre>
							</Accordion.Content>
						</Accordion.Item>
					</Accordion.Root>
				</section>
				<Separator class="my-2" />
			</Dialog.Description>
			<Dialog.Footer class="flex justify-start gap-2">
				<Button disabled={loading} href={`/templates/create?template=${template}`}>Edit</Button>
				<TwostepButton disabled={loading} onclick={() => removeTemplate(template)}
					>Delete</TwostepButton
				>
				<Button disabled={loading} onclick={() => download(template)}>Download</Button>
				{#if templateData.imported}
					<TwostepButton
						detail="Are you sure you want to mark this template as trusted? This will remove the warning and let you run the template without confirmation."
						variant="cta"
						smallText={false}
						class="ml-auto"
						onclick={() => markTrusted(template)}>Mark as trusted</TwostepButton
					>
				{:else}
					<Button
						class="ml-auto"
						variant="cta"
						disabled={loading}
						onclick={() => createSessionFromTemplate(template)}>Start session</Button
					>
				{/if}
			</Dialog.Footer>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>

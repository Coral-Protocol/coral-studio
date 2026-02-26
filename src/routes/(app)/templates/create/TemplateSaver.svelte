<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { randomAdjective, randomAnimal } from '$lib/words';
	import * as Label from '$lib/components/ui/label';
	import * as InputGroup from '$lib/components/ui/input-group';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	let { open = $bindable(false), data }: { open: boolean; data: string } = $props();

	let templateName = $state(`${randomAdjective()}-${randomAnimal()}`);
	let templateDescription = $state('');
	let overwriteWarning = $state(false);

	const TEMPLATE_NAME_REGEX = /^[a-zA-Z0-9_-]{1,32}$/;

	onMount(() => {
		const template = page.url.searchParams.get('template');
		if (template) {
			templateName = template;
		}

		if (localStorage.getItem(`template_${templateName}`) != null) {
			overwriteWarning = true;
		}
	});

	const save = () => {
		if (!templateName.trim()) {
			toast.error('Template name cannot be empty.');
			return;
		}

		if (!TEMPLATE_NAME_REGEX.test(templateName)) {
			toast.error(
				'Template name must be 1-32 characters and contain only letters, numbers, "-" or "_".'
			);
			return;
		}

		if (!data) {
			toast.error('No template data to save.');
			return;
		}

		try {
			const template = {
				name: templateName,
				data,
				updated: Date.now(),
				description: templateDescription
			};
			localStorage.setItem(`template_${templateName}`, JSON.stringify(template));
			toast.success(
				overwriteWarning ? 'Template updated successfully!' : 'Template saved successfully!'
			);
			open = false;

			try {
				const templateIndex = JSON.parse(localStorage.getItem('template_index') || '[]');

				const updatedIndex = [...new Set([...templateIndex, templateName])];

				localStorage.setItem('template_index', JSON.stringify(updatedIndex));
			} catch (error) {
				console.error('Error updating template index:', error);
			}
		} catch (error) {
			console.error('Error saving template:', error);
			toast.error('Failed to save template.');
		}
	};
</script>

<Dialog.Root bind:open>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Save Template</Dialog.Title>
			<Dialog.Description class="flex flex-col gap-4">
				<p class="py-4">
					Here you can save your current template configuration. This will allow you to easily load
					it again in the future.
				</p>
				<InputGroup.Root>
					<InputGroup.Input
						aria-invalid={overwriteWarning}
						id="templateName"
						bind:value={templateName}
						oninput={() => {
							localStorage.getItem(`template_${templateName}`) != null
								? (overwriteWarning = true)
								: (overwriteWarning = false);
						}}
					/>
					<InputGroup.Addon align="block-start">
						<Label.Root for="templateName" class="text-foreground">Template Name</Label.Root>
					</InputGroup.Addon>
				</InputGroup.Root>

				<InputGroup.Root>
					<InputGroup.Textarea
						id="templateDescription"
						bind:value={templateDescription}
						class="min-h-[80px]"
						placeholder="Add an optional description for your template"
					/>

					<InputGroup.Addon align="block-start">
						<Label.Root for="templateDescription" class="text-foreground">Description</Label.Root>
					</InputGroup.Addon>
				</InputGroup.Root>

				<Separator />

				<p class="text-muted-foreground text-xs">
					<strong>Templates are stored locally in your browser's storage</strong>, so they will only
					be available on this device and browser.
				</p>
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button onclick={save} variant={overwriteWarning ? 'destructive' : 'default'}
				>{overwriteWarning ? 'Overwrite' : 'Save'}</Button
			>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

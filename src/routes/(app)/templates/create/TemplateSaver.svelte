<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import Input from '$lib/components/ui/input/input.svelte';
	import { randomAdjective, randomAnimal } from '$lib/words';
	import * as Label from '$lib/components/ui/label';
	import * as InputGroup from '$lib/components/ui/input-group';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import TwostepButton from '$lib/components/twostep-button.svelte';
	import { getValue } from '@unovis/ts';

	let { open = $bindable(false), data }: { open: boolean; data: string } = $props();

	let templateName = $state(`${randomAdjective()}-${randomAnimal()}`);
	let overwriteWarning = $state(false);

	onMount(() => {
		const template = page.url.searchParams.get('template');
		if (template) {
			templateName = template;
		}

		if (localStorage.getItem(`template_${templateName}`) != null) {
			overwriteWarning = true;
		}
	});

	// TODO: the above WILL have collisions cause the generator doesnt have many words, need to handle sequals and how overwrites later

	const download = () => {
		try {
			const blob = new Blob([data], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${templateName}.json`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Error downloading template:', error);
		}
	};

	//TODO: the above only downloads the session json but it should download the template json instead cause rn if you download this then import it, it will not work, but download from main template page works fine

	const save = () => {
		if (!templateName.trim()) {
			toast.error('Template name cannot be empty.');
			return;
		}

		if (!data) {
			toast.error('No template data to save.');
			return;
		}

		try {
			const template = { name: templateName, data, updated: Date.now() };
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

				<Separator />

				<p class="text-muted-foreground text-xs">
					<strong>Templates are stored locally in your browser's storage</strong>, so they will only
					be available on this device and browser.
				</p>
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button onclick={download} variant="ghost">Download</Button>
			<Button onclick={save} variant={overwriteWarning ? 'destructive' : 'default'}
				>{overwriteWarning ? 'Overwrite' : 'Save'}</Button
			>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

	import IconArrowsClockwise from 'phosphor-icons-svelte/IconArrowsClockwiseRegular.svelte';

	import CodeMirror from 'svelte-codemirror-editor';
	import { json } from '@codemirror/lang-json';
	import { dracula } from '@uiw/codemirror-theme-dracula';

	import { Separator } from '$lib/components/ui/separator';
	import { buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import CopyButton from '$lib/components/copy-button.svelte';
	import { PersistedState } from 'runed';
	import { fade } from 'svelte/transition';
	import CodeSnippet from './CodeSnippet.svelte';
	import { createSessionContext } from '../+page.svelte';

	let ctx = createSessionContext.get();

	const editorTab = new PersistedState('sessionEditorTab', 'json');
	let payloadJson = $derived(ctx.payload ? JSON.stringify(ctx.payload, null, 4) : '');
	let jsonDirty = $state(false);
</script>

<Tabs.Root bind:value={editorTab.current} class="grow gap-0 overflow-hidden">
	<Tabs.List class="bg-sidebar  flex w-full justify-start rounded-none border-b *:rounded-none">
		<Tabs.Trigger value="json" class="grow-0">Session editor{jsonDirty ? '*' : ''}</Tabs.Trigger>
		<Separator orientation="vertical" class="" />
		<Tabs.Trigger value="js" class="grow-0">JavaScript</Tabs.Trigger>
		<Tabs.Trigger value="py" class="grow-0">Python</Tabs.Trigger>
		<!-- <Tabs.Trigger value="curl" class="grow-0">cURL</Tabs.Trigger> -->
	</Tabs.List>
	<Tabs.Content value="json" class="relative overflow-y-auto">
		<section class="absolute top-5 right-5 z-10 flex flex-col gap-2">
			<CopyButton value={payloadJson} />
			{#if jsonDirty}
				<span transition:fade={{ duration: 100 }}>
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger
								class={cn(buttonVariants({ size: 'icon' }), '')}
								onclick={() => ctx.importSession({ from: payloadJson })}
							>
								<IconArrowsClockwise /></Tooltip.Trigger
							>
							<Tooltip.Content>Update session graph from JSON</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>
				</span>
			{/if}
		</section>
		<CodeMirror
			bind:value={payloadJson}
			onchange={() => {
				jsonDirty = true;
			}}
			lang={json()}
			tabSize={4}
			theme={dracula}
			lineWrapping={true}
			class="absolute inset-0 [&_.cm-content]:p-0! [&>*]:size-full "
		/>
	</Tabs.Content>
	<Tabs.Content value="js" class="relative overflow-y-auto">
		{#if ctx.payload}
			<CodeSnippet snippet="javascript" body={ctx.payload} />
		{/if}
	</Tabs.Content>
	<Tabs.Content value="py" class="relative overflow-y-auto">
		{#if ctx.payload}
			<CodeSnippet snippet="python" body={ctx.payload} />
		{/if}
	</Tabs.Content>
</Tabs.Root>

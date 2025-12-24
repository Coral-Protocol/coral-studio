<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { ScrollArea } from '../ui/scroll-area';
	import { onMount } from 'svelte';

	let { open = $bindable(false) } = $props();

	const STORAGE_KEY = 'coral-console-welcome-shown';

	onMount(() => {
		const hasSeenWelcome = localStorage.getItem(STORAGE_KEY);
		if (!hasSeenWelcome) {
			open = true;
			localStorage.setItem(STORAGE_KEY, 'true');
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="mx-auto flex h-[70%] max-h-[70%] w-full max-w-2xl flex-col overflow-hidden">
		<Dialog.Header>
			<Dialog.Title class="text-xl font-semibold">Welcome to Coral Console</Dialog.Title>
			<Dialog.Description>
				Your playground for exploring and testing Coral agents
			</Dialog.Description>
		</Dialog.Header>
		<ScrollArea class="min-h-0 flex-1 pr-4">
			<div class="space-y-6 pb-4">
				<section>
					<h3 class="mb-2 text-lg font-medium">What is Coral Console?</h3>
					<p class="text-muted-foreground">
						Coral Console is a playground for <strong>Coral</strong> — a framework for orchestrating AI agents.
						Use this console to browse available agents and try them out interactively.
					</p>
				</section>

				<section>
					<h3 class="mb-2 text-lg font-medium">Browsing Agents</h3>
					<p class="text-muted-foreground">
						Navigate through the sidebar to explore the agent registry and view all available agents. 
						You can create sessions to interact with agents and test their capabilities in real-time.
					</p>
				</section>

				<section>
					<h3 class="mb-2 text-lg font-medium">Creating Agents Programmatically</h3>
					<p class="text-muted-foreground">
						Agents are intended to be created programmatically in your application code. 
						The console serves as a testing and exploration tool, but for production use, 
						you'll want to integrate agents directly into your codebase.
					</p>
				</section>

				<section>
					<h3 class="mb-2 text-lg font-medium">Using the Network Tab</h3>
					<p class="text-muted-foreground mb-2">
						To use an agent in your own application:
					</p>
					<ol class="text-muted-foreground list-inside list-decimal space-y-2">
						<li>Open your browser's Developer Tools (F12 or Cmd+Option+I)</li>
						<li>Navigate to the <strong>Network</strong> tab</li>
						<li>Interact with an agent in the console</li>
						<li>Find the relevant API request in the network log</li>
						<li>Right-click the request and select <strong>"Copy as cURL"</strong></li>
						<li>Use this cURL command as a reference for your application code</li>
					</ol>
				</section>

				<section>
					<h3 class="mb-2 text-lg font-medium">Quick Tips</h3>
					<ul class="text-muted-foreground list-inside list-disc space-y-1">
						<li>Use <kbd class="bg-muted rounded px-1.5 py-0.5 text-xs">Ctrl+K</kbd> to quickly search and navigate</li>
						<li>Press <kbd class="bg-muted rounded px-1.5 py-0.5 text-xs">Shift+R</kbd> to refresh agent configurations</li>
						<li>Press <kbd class="bg-muted rounded px-1.5 py-0.5 text-xs">Shift+N</kbd> to create a new session</li>
						<li>Press <kbd class="bg-muted rounded px-1.5 py-0.5 text-xs">Shift+?</kbd> to view all keyboard shortcuts</li>
					</ul>
				</section>

				<section class="border-muted rounded-lg border p-4">
					<p class="text-muted-foreground text-sm">
						💡 <strong>Tip:</strong> You can reopen this help dialog anytime by clicking the 
						help icon next to the search button in the top-right corner.
					</p>
				</section>
			</div>
		</ScrollArea>
	</Dialog.Content>
</Dialog.Root>

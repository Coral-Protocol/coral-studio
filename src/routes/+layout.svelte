<script lang="ts">
	import { Toaster } from '$lib/components/ui/sonner';
	import { ModeWatcher } from 'mode-watcher';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Coral Studio</title>
</svelte:head>

<ModeWatcher />
<Toaster />

{@render children()}

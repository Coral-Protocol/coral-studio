<script lang="ts">
	import { Toaster } from '$lib/components/ui/sonner';
	import { Socket, socketCtx, UserInput } from '$lib/socket.svelte';
	import { sessionCtx } from '$lib/threads';
	import { ModeWatcher } from 'mode-watcher';
	import '../app.css';

	let { children } = $props();

	let session = $state({
		connection: null,
		session: null,
		sessions: null,
		registry: null
	});
	sessionCtx.set(session);

	let socket = $state({
		socket: new Socket(),
		userInput: new UserInput()
	});
	socketCtx.set(socket);
</script>

<ModeWatcher />
<Toaster />
{@render children()}

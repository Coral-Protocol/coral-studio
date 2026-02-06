<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import { socketCtx, UserInput } from '$lib/socket.svelte';
	import { appContext, type AppContext } from '$lib/context';
	import { CoralServer } from '$lib/CoralServer.svelte';
	import { onMount } from 'svelte';
	import ErrorPageHandler from '$lib/components/error-page-handler.svelte';

	let ctx: AppContext = $state({
		server: new CoralServer(),
		connection: null,
		session: null,
		sessions: null,
		registry: null,
		logs: null
	});
	appContext.set(ctx);

	onMount(() => {
		ctx.server.fetchAll();
	});

	let socket = $state({
		userInput: new UserInput()
	});
	socketCtx.set(socket);
</script>

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset class="relative">
		<ErrorPageHandler />
	</Sidebar.Inset>
</Sidebar.Provider>

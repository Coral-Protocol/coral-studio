<script lang="ts">
	import { socketCtx, UserInput } from '$lib/socket.svelte';
	import { Logs } from '$lib/logs.svelte';
	import { watch } from 'runed';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import { appContext, type AppContext } from '$lib/context';
	import { CoralServer } from '$lib/CoralServer.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

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

	//if we get problems we just need to logCtx.logs[agent]?.close() before assigning, according to our good developer friend, Alan.

	// watch([() => ctx.session, () => Object.keys(ctx.session?.agents ?? {})], () => {
	// 	if (!ctx.session) return;
	// 	if (ctx.logs !== null && ctx.logs.session !== ctx.session.sessionId) {
	// 		ctx.logs = null;
	// 		console.log('invalidating session logs');
	// 	}
	//        ctx.logs = new Logs({session: ctx.session.session}, );
	// 	for (const agent of Object.keys(ctx.session.agents)) {
	// 		if (!(agent in logCtx.logs)) {
	// 			logCtx.logs[agent] = new Logs({ session: ctx.session.sessionId }, agent);
	// 			console.log(`opening agent logs for '${agent}'`);
	// 		}
	// 	}
	// });

	let socket = $state({
		userInput: new UserInput()
	});
	socketCtx.set(socket);
</script>

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset>
		{@render children()}
	</Sidebar.Inset>
</Sidebar.Provider>

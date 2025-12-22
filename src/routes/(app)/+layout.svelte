<script lang="ts">
	import { socketCtx, UserInput } from '$lib/socket.svelte';
	import { AgentLogs, logContext } from '$lib/logs.svelte';
	import { watch } from 'runed';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import { appContext, type AppContext } from '$lib/context';
	import { CoralServer } from '$lib/CoralServer.svelte';
	import { onMount } from 'svelte';
	import Login from './Login.svelte';

	let { children } = $props();

	let ctx: AppContext = $state({
		server: new CoralServer(),
		connection: null,
		session: null,
		sessions: null,
		registry: null
	});
	appContext.set(ctx);

	let logCtx: ReturnType<(typeof logContext)['get']> = $state({
		session: null,
		logs: {}
	});

	logContext.set(logCtx);

	onMount(() => {
		ctx.server.fetchAll();
	});

	//if we get problems we just need to logCtx.logs[agent]?.close() before assigning, according to our good developer friend, Alan.

	watch([() => ctx.session, () => Object.keys(ctx.session?.agents ?? {})], () => {
		if (!ctx.session) return;
		if (logCtx.session !== null && logCtx.session !== ctx.session.sessionId) {
			logCtx.logs = {};
			console.log('invalidating session logs');
		}
		logCtx.session = ctx.session.sessionId;
		for (const agent of Object.keys(ctx.session.agents)) {
			if (!(agent in logCtx.logs)) {
				logCtx.logs[agent] = new AgentLogs({ session: ctx.session.sessionId }, agent);
				console.log(`opening agent logs for '${agent}'`);
			}
		}
	});

	let loginOpen = $state(false);

	function openLoginDialog() {
		loginOpen = true;
	}
	let socket = $state({
		userInput: new UserInput()
	});
	socketCtx.set(socket);
</script>

<Login bind:open={loginOpen} />

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset>
		{@render children()}
	</Sidebar.Inset>
</Sidebar.Provider>

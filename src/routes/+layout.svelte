<script lang="ts">
	import { Toaster } from '$lib/components/ui/sonner';
	import { socketCtx, UserInput } from '$lib/socket.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import '../app.css';
	import { AgentLogs, logContext } from '$lib/logs.svelte';
	import { watch } from 'runed';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import { page } from '$app/state';
	import createClient from 'openapi-fetch';
	import type { paths } from '$generated/api';
	import { appContext, type AppContext } from '$lib/context';
	import { base } from '$app/paths';
	import { CoralServer } from '$lib/coralServer';

	let { children } = $props();

	let session: AppContext = $state({
		server: new CoralServer(),
		connection: null,
		session: null,
		sessions: null,
		registry: null
	});
	appContext.set(session);

	let logCtx: ReturnType<(typeof logContext)['get']> = $state({
		session: null,
		logs: {}
	});
	logContext.set(logCtx);

	//if we get problems we just need to logCtx.logs[agent]?.close() before assigning, according to our good developer friend, Alan.

	watch([() => session.session, () => Object.keys(session.session?.agents ?? {})], () => {
		if (!session.session) return;
		if (logCtx.session !== null && logCtx.session !== session.session.session) {
			logCtx.logs = {};
			console.log('invalidating session logs');
		}
		logCtx.session = session.session.session;
		for (const agent of Object.keys(session.session.agents)) {
			if (!(agent in logCtx.logs)) {
				logCtx.logs[agent] = new AgentLogs({ session: session.session.session }, agent);
				console.log(`opening agent logs for '${agent}'`);
			}
		}
	});

	let socket = $state({
		userInput: new UserInput()
	});
	socketCtx.set(socket);
</script>

<svelte:head>
	<title>Coral Studio</title>
</svelte:head>

<ModeWatcher />
<Toaster />
<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset>
		{@render children()}
	</Sidebar.Inset>
</Sidebar.Provider>

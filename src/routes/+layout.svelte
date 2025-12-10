<script lang="ts">
	import { Toaster } from '$lib/components/ui/sonner';
	import { socketCtx, UserInput } from '$lib/socket.svelte';
	import { sessionCtx } from '$lib/threads';
	import { ModeWatcher } from 'mode-watcher';
	import '../app.css';
	import { AgentLogs, logContext } from '$lib/logs.svelte';
	import { watch } from 'runed';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import AppSidebar from '$lib/components/app-sidebar.svelte';

	let { children } = $props();

	let session: ReturnType<(typeof sessionCtx)['get']> = $state({
		connection: null,
		session: null,
		sessions: null,
		registry: null
	});
	sessionCtx.set(session);

	let logCtx: ReturnType<(typeof logContext)['get']> = $state({
		session: null,
		logs: {}
	});
	logContext.set(logCtx);

	//if we get problems we just need to logCtx.logs[agent]?.close() before assigning, according to our good developer friend, Alan.

	watch(
		[
			() => session.session,
			() => session.connection,
			() => Object.keys(session.session?.agents ?? {})
		],
		() => {
			if (!session.session || !session.connection) return;
			if (logCtx.session !== null && logCtx.session !== session.session.session) {
				logCtx.logs = {};
				console.log('invalidating session logs');
			}
			logCtx.session = session.session.session;
			for (const agent of Object.keys(session.session.agents)) {
				if (!(agent in logCtx.logs)) {
					logCtx.logs[agent] = new AgentLogs(
						{ ...session.connection, session: session.session.session },
						agent
					);
					console.log(`opening agent logs for '${agent}'`);
				}
			}
		}
	);

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

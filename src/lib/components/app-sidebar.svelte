<script lang="ts" module>
</script>

<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Tooltip from '$lib/components/ui/tooltip';

	import { Button } from '$lib/components/ui/button';

	import ChevronDown from 'phosphor-icons-svelte/IconCaretDownRegular.svelte';
	import MoonIcon from 'phosphor-icons-svelte/IconMoonRegular.svelte';
	import SunIcon from 'phosphor-icons-svelte/IconSunRegular.svelte';
	import IconArrowsClockwise from 'phosphor-icons-svelte/IconArrowsClockwiseRegular.svelte';
	import IconChats from 'phosphor-icons-svelte/IconChatsRegular.svelte';
	import IconRobot from 'phosphor-icons-svelte/IconRobotRegular.svelte';
	import IconToolbox from 'phosphor-icons-svelte/IconToolboxRegular.svelte';
	import IconPackage from 'phosphor-icons-svelte/IconPackageRegular.svelte';
	import IconNotepad from 'phosphor-icons-svelte/IconNotepadRegular.svelte';

	import { cn } from '$lib/utils';
	import { sessionCtx, type RegistryAgent } from '$lib/threads';
	import { Session } from '$lib/session.svelte';

	import { socketCtx } from '$lib/socket.svelte';
	import { toggleMode } from 'mode-watcher';

	import CreateSession from '$lib/components/dialogs/create-session.svelte';

	import ServerSwitcher from './server-switcher.svelte';
	import NavBundle from './nav-bundle.svelte';
	import SidebarLink from './sidebar-link.svelte';
	import Tour from './tour/tour.svelte';
	import { onMount } from 'svelte';

	let sessCtx = sessionCtx.get();
	let tools = socketCtx.get();
	let conn = $derived(sessCtx.session);

	let connecting = $state(false);
	let error: string | null = $state(null);

	let tourOpen = $state(false);

	onMount(() => {
		if (sessCtx.connection === null) tourOpen = true;
	});

	let createSessionOpen = $state(false);

	const refreshAgents = async () => {
		if (!sessCtx.connection) return;
		try {
			connecting = true;
			error = null;
			sessCtx.registry = null;
					const agents = (await fetch(`http://${sessCtx.connection.host}/api/v1/agents`).then((res) =>
			res.json()
		)) as RegistryAgent[];
			sessCtx.registry = Object.fromEntries(agents.map((agent) => [agent.id, agent]));

			const sessions = (await fetch(`http://${sessCtx.connection.host}/api/v1/sessions`).then(
				(res) => res.json()
			)) as string[];
			sessCtx.sessions = sessions;
			connecting = false;
		} catch (e) {
			connecting = false;
			sessCtx.registry = null;
			error = `${e}`;
		}
	};

	let serverSwitcher = $state(null) as unknown as HTMLButtonElement;
	let sessionSwitcher = $state(null) as unknown as HTMLButtonElement;
</script>

<CreateSession bind:open={createSessionOpen} agents={sessCtx.registry ?? {}} />
<Tour
	open={tourOpen}
	items={[
		{
			target: serverSwitcher,
			side: 'right',
			text: 'Welcome to Coral Studio!\n\nFirst, connect to your server here.'
		},
		{
			target: sessionSwitcher,
			side: 'right',
			text: 'Then, once connected:\n\nCreate or connect to a session here.'
		}
	]}
/>
<Sidebar.Root>
	<Sidebar.Header>
		<ServerSwitcher
			bind:ref={serverSwitcher}
			onSelect={(host) => {
				sessCtx.connection = {
					host,
					appId: sessCtx.connection?.appId ?? 'app',
					privacyKey: sessCtx.connection?.privacyKey ?? 'priv'
				};
				refreshAgents();
			}}
		/>
	</Sidebar.Header>
	<Sidebar.Content class="gap-0">
		<Sidebar.Group>
			<Sidebar.GroupLabel class="text-sidebar-foreground flex flex-row gap-1 pr-0 text-sm">
				<span class="text-muted-foreground font-sans font-medium tracking-wide select-none"
					>Server</span
				>
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger disabled={error === null} class="flex-grow text-right ">
							<span
								class={cn(
									'text-muted-foreground font-mono text-xs font-normal',
									error && 'text-destructive'
								)}
							>
								{#if error}
									Error
								{:else if sessCtx.registry}
									{Object.keys(sessCtx.registry).length} agents
								{/if}
							</span>
						</Tooltip.Trigger>
						<Tooltip.Content><p>{error}</p></Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
				<Button
					size="icon"
					variant="ghost"
					class="size-7"
					disabled={connecting}
					onclick={() => refreshAgents()}
				>
					<IconArrowsClockwise class={cn('size-4', connecting && 'animate-spin')} />
				</Button>
			</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					<SidebarLink url="/registry" icon={IconPackage} title="Agent Registry" />
					<SidebarLink url="/logs" icon={IconNotepad} title="Logs" />
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
		<Sidebar.Separator />
		<Sidebar.Group>
			<Sidebar.GroupLabel class="text-muted-foreground">Session</Sidebar.GroupLabel>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Sidebar.MenuButton
							{...props}
							bind:ref={sessionSwitcher}
							aria-invalid={sessCtx.session === null || !sessCtx.session.connected}
							class="border-input ring-offset-background aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive m-[0.5px] mb-1 aria-invalid:ring"
						>
							<span class="truncate"
								>{sessCtx.session && sessCtx.session.connected
									? sessCtx.session.session
									: 'Select Session'}</span
							>
							<ChevronDown class="ml-auto" />
						</Sidebar.MenuButton>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content class="w-(--bits-dropdown-menu-anchor-width)">
					{#if sessCtx.sessions && sessCtx.sessions.length > 0}
						{#each sessCtx.sessions as session}
							<DropdownMenu.Item
								onSelect={() => {
									if (!sessCtx.connection) return;
									sessCtx.session = new Session({ ...sessCtx.connection, session });
								}}
							>
								<span class="truncate">{session}</span>
							</DropdownMenu.Item>
						{/each}
						<DropdownMenu.Separator />
					{/if}
					<DropdownMenu.Item
						onclick={() => {
							createSessionOpen = true;
						}}
					>
						<span>New session</span>
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
			<NavBundle
				items={[
					{
						title: 'Threads',
						icon: IconChats,
						sumBadges: true,
						items: conn
							? Object.values(conn.threads).map((thread) => ({
									id: thread.id,
									title: thread.name,
									url: `/thread/${thread.id}`,
									badge: thread.unread
								}))
							: []
					},
					{
						title: 'Agents',
						icon: IconRobot,
						items: conn
							? Object.entries(conn.agents).map(([title, agent]) => ({
									title,
									url: `/agent/${title}`,
									state: agent.state ?? 'disconnected'
								}))
							: []
					},
					{
						title: 'Tools',
						icon: IconToolbox,
						sumBadges: true,
						items: [
							{
								title: 'User Input',
								url: '/tools/user-input',
								badge: Object.values(tools.userInput.requests).filter(
									(req) => req.userQuestion === undefined
								).length
							}
						]
					}
				]}
			/>
		</Sidebar.Group>
	</Sidebar.Content>
	<Sidebar.Footer>
		<Sidebar.Menu>
			<Sidebar.MenuItem class="flex justify-end">
				<Button onclick={toggleMode} variant="outline" size="icon">
					<SunIcon
						class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
					/>
					<MoonIcon
						class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
					/>
					<span class="sr-only">Toggle theme</span>
				</Button>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>

<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import * as Kbd from '$lib/components/ui/kbd/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import Quickswitch from '$lib/components/dialogs/quickswitch.svelte';
	import DebugTools from '$lib/components/dialogs/debugtools.svelte';

	import IconFileArchive from 'phosphor-icons-svelte/IconFileArchiveRegular.svelte';
	import CaretUpDown from 'phosphor-icons-svelte/IconCaretUpDownRegular.svelte';
	import MoonIcon from 'phosphor-icons-svelte/IconMoonRegular.svelte';
	import SunIcon from 'phosphor-icons-svelte/IconSunRegular.svelte';
	import IconArrowsClockwise from 'phosphor-icons-svelte/IconArrowsClockwiseRegular.svelte';
	import IconChats from 'phosphor-icons-svelte/IconChatsRegular.svelte';
	import IconRobot from 'phosphor-icons-svelte/IconRobotRegular.svelte';
	import IconSearch from 'phosphor-icons-svelte/IconMagnifyingGlassRegular.svelte';
	import IconPackage from 'phosphor-icons-svelte/IconPackageRegular.svelte';
	import IconNotepad from 'phosphor-icons-svelte/IconNotepadRegular.svelte';

	import { tick } from 'svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';

	import { cn } from '$lib/utils';
	import { socketCtx } from '$lib/socket.svelte';
	import { toggleMode } from 'mode-watcher';

	import ServerSwitcher from './namespace-switcher.svelte';
	import NavBundle from './nav-bundle.svelte';
	import SidebarLink from './sidebar-link.svelte';
	import Tour from './tour/tour.svelte';

	import { Session } from '$lib/session.svelte';

	import { supabase } from '$lib/supabaseClient';
	import { goto } from '$app/navigation';
	import Shortcuts from './dialogs/shortcuts.svelte';
	import { appContext } from '$lib/context';

	let content = $state('');
	let user_email = $state('');

	let ctx = appContext.get();
	let tools = socketCtx.get();
	let conn = $derived(ctx.session);

	let connecting = $state(false);
	let error: string | null = $state(null);

	let tourOpen = $state(false);

	const refreshAgents = async () => {
		try {
			connecting = true;
			error = null;

			await ctx.server.fetchAll();

			connecting = false;
			return agents;
		} catch (e) {
			connecting = false;
			error = `${e}`;
			throw e;
		}
	};

	let namespaceSwitcher = $state(null) as unknown as HTMLButtonElement;
	let sessionSwitcher = $state(null) as unknown as HTMLButtonElement;

	let feedbackVisible = $state(false);

	async function handleSubmit(event: { preventDefault: () => void }) {
		event.preventDefault();

		const { data, error } = await supabase.from('feedback').insert([{ content, user_email }]);

		if (error) {
			toast.error('Error submitting feedback. Please try again later. ' + error.message);
		} else {
			toast.success('Feedback submitted successfully. Thank you!');
			content = '';
			user_email = '';
			feedbackVisible = false;
		}
	}

	$effect(() => {
		const hasNewRequest = Object.values(tools.userInput.requests).some(
			(req) => req.userQuestion === undefined
		);
		if (hasNewRequest) {
			toast.info('New input request from an agent', {
				duration: 4000,
				id: 'new-user-input-message',
				action: {
					label: 'View',
					onClick: () => {
						goto('/tools/user-input');
					}
				}
			});
		}
	});

	let sessionSearcherOpen = $state(false);
	let value = $state('');
	let triggerRef = $state<HTMLButtonElement>(null!);

	function closeAndFocusTrigger() {
		sessionSearcherOpen = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}
	// TODO: refactor below into one object
	let agents = $derived(
		conn
			? Object.entries(conn.agents).map(([title, agent]) => ({
					title,
					url: `/agent/${title}`,
					state: agent.state ?? 'disconnected'
				}))
			: []
	);

	let threads = $derived(
		conn
			? Object.values(conn.threads).map((thread) => ({
					id: thread.id,
					title: thread.name,
					url: `/thread/${thread.id}`,
					badge: thread.unread
				}))
			: []
	);

	let openQuickswitch = $state(false),
		openShortcuts = $state(false),
		debugToolsOpen = $state(false);

	const handleKeydown = (event: KeyboardEvent) => {
		const target = event.target as HTMLElement | null;
		if (target) {
			const tag = target.tagName;
			if (
				tag === 'INPUT' ||
				tag === 'TEXTAREA' ||
				tag === 'SELECT' ||
				(target.isContentEditable ?? false)
			) {
				return;
			}
		}

		const mod = event.ctrlKey || event.metaKey; // support Cmd on macOS

		if (mod && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			openQuickswitch = !openQuickswitch;
			return;
		}

		if (event.shiftKey) {
			const k = event.key.toLowerCase();
			if (k === 'd') {
				debugToolsOpen = !debugToolsOpen;
				return;
			}
			if (k === 'r') {
				toast.promise(refreshAgents(), {
					loading: `Refreshing agent configuration...`,
					success: `Agent configuration refreshed`,
					error: (err) => `Failed to refresh agent configuration, Error: ${err || err}`
				});
				return;
			}
			if (k === 'n') {
				if (window.location.pathname !== '/sessions/create') {
					goto(`/sessions/create`);
					toast.info('Navigated to session creation page');
				}
				return;
			}
			if (k === '/') {
				openShortcuts = !openShortcuts;
				return;
			}
		}
	};
</script>

<svelte:window on:keydown={handleKeydown} />

<Quickswitch {ctx} {agents} {threads} bind:open={openQuickswitch} bind:debugMenu={debugToolsOpen} />
<Shortcuts bind:open={openShortcuts} />
<DebugTools bind:open={debugToolsOpen} />

<button
	class="bg-primary fixed top-3 right-3 z-50 flex max-w-64 cursor-text items-center justify-between gap-6 rounded-md border p-2"
	onclick={() => (openQuickswitch = true)}
>
	<div class="text-muted-foreground flex items-center gap-2">
		<IconSearch class="" />
		<span class="text-sm">Search</span>
	</div>
	<Kbd.Group>
		<Kbd.Root>CTRL</Kbd.Root>
		<Kbd.Root>K</Kbd.Root>
	</Kbd.Group>
</button>

<!-- <Tour
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
			text: 'Then, once connected:\n\nCreate a session here.'
		}
	]}
/> -->

<Sidebar.Root>
	<Sidebar.Header>
		<ServerSwitcher bind:ref={namespaceSwitcher} />
		<Sidebar.GroupLabel class="pr-0">
			<span
				class="text-muted-foreground w-full grow font-sans font-medium tracking-wide select-none"
				>Server</span
			>
			<Tooltip.Provider delayDuration={0}>
				<Tooltip.Root>
					<Tooltip.Trigger disabled={error === null}>
						<span
							class={cn(
								'text-muted-foreground  font-mono text-xs font-normal',
								(error || !ctx.server.alive) && 'text-destructive'
							)}
						>
							{#if error || !ctx.server.alive}
								disconnected
							{:else}
								connected
							{/if}
						</span>
					</Tooltip.Trigger>
					<Tooltip.Content><p>{error}</p></Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
			<Button
				size="icon"
				variant="ghost"
				class="mx-1 size-7"
				disabled={connecting}
				onclick={() => refreshAgents()}
			>
				<IconArrowsClockwise class={cn('size-4', connecting && 'animate-spin')} />
			</Button>
		</Sidebar.GroupLabel>
		<Sidebar.GroupContent>
			<Sidebar.Menu>
				<!-- <SidebarLink url="/" icon={IconHome} title="Home" /> -->
				<SidebarLink url="/server/registry" icon={IconPackage} title="Agent Registry" />
				<SidebarLink url="/server/logs" icon={IconNotepad} title="Logs" />
			</Sidebar.Menu>
		</Sidebar.GroupContent>
	</Sidebar.Header>
	<Sidebar.Content class="gap-0 overflow-hidden">
		<!-- <Sidebar.Group>
			<Sidebar.Separator />

			<Sidebar.GroupLabel class="text-sidebar-foreground flex flex-row gap-1 pr-0 text-sm">
				<span class="text-muted-foreground grow font-sans font-medium tracking-wide select-none"
					>Finance</span
				>
			</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					<SidebarLink
						url="/finance/wallet"
						icon={IconWallet}
						title="Wallet"
						disable={sessCtx.connection === null}
					/>
					<SidebarLink
						url="/finance/dashboard"
						icon={IconDashboard}
						title="Dashboard"
						disable={sessCtx.connection === null}
					/>
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group> -->
		<Sidebar.Group class="">
			<Sidebar.Separator />

			<Sidebar.GroupContent>
				<Sidebar.Menu>
					<Sidebar.GroupLabel class="text-muted-foreground">Session</Sidebar.GroupLabel>
					<Popover.Root bind:open={sessionSearcherOpen}>
						<section class="my-2 flex w-full gap-2">
							<Popover.Trigger
								class="bg-sidebar border-offset-background dark:aria-invalid:border-destructive/40 aria-invalid:border-destructive relative  w-full flex-1 grow justify-between truncate border-1 "
								aria-invalid={ctx.server.sessions.length !== 0 &&
									(ctx.session === null || !ctx.session.connected)}
							>
								{#snippet child({ props })}
									<Button
										variant="outline"
										{...props}
										role="combobox"
										aria-expanded={sessionSearcherOpen}
										disabled={ctx.server.sessions.length === 0}
										bind:ref={triggerRef}
									>
										<span class=" w-4/5 grow truncate overflow-hidden">
											{ctx.session && ctx.session.connected
												? ctx.session.session
												: 'Select a Session'}
										</span>
										<CaretUpDown />
									</Button>
								{/snippet}
							</Popover.Trigger>
							<Button
								onclick={() => {
									goto(`/sessions/create`);
								}}
								bind:ref={sessionSwitcher}>New</Button
							>
							<Popover.Content align="center" class="">
								<Command.Root>
									<Command.Input placeholder="Search" />
									<Command.List>
										<Command.Empty>No sessions found</Command.Empty>
										{#if ctx.sessions && ctx.sessions.length > 0}
											<Command.Group>
												{#each ctx.sessions as session}
													<Command.Item
														onSelect={() => {
															value = session;
															closeAndFocusTrigger();
															ctx.session = new Session({ session });
														}}
													>
														{session}
													</Command.Item>
												{/each}
											</Command.Group>
										{/if}
									</Command.List>
								</Command.Root>
							</Popover.Content>
						</section>
					</Popover.Root>
					<!-- <SidebarLink
						url="/sessions/overview"
						icon={IconListMag}
						title="Session Overview"
						disable={!sessCtx.session}
					/> -->
					<SidebarLink
						url="/tools/user-input"
						icon={IconChats}
						title="Input Requests"
						disable={!ctx.session &&
							Object.values(tools.userInput.requests).filter(
								(req) => req.userQuestion === undefined
							).length === 0}
						badge={Object.values(tools.userInput.requests).filter(
							(req) => req.userQuestion === undefined
						).length}
					/>
					<NavBundle
						items={[
							{
								title: 'Threads',
								icon: IconFileArchive,
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
							}
						]}
					/>
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
	<Sidebar.Footer>
		<Sidebar.Menu>
			<Sidebar.MenuItem class="flex justify-end gap-4">
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

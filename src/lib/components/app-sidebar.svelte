<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { toast } from 'svelte-sonner';
	import {
		Button,
		buttonVariants,
		type ButtonSize,
		type ButtonVariant
	} from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import Quickswitch from '$lib/components/dialogs/quickswitch.svelte';

	import ChevronDown from 'phosphor-icons-svelte/IconCaretDownRegular.svelte';
	import CaretUpDown from 'phosphor-icons-svelte/IconCaretUpDownRegular.svelte';
	import MoonIcon from 'phosphor-icons-svelte/IconMoonRegular.svelte';
	import EyeOpen from 'phosphor-icons-svelte/IconEyeRegular.svelte';
	import EyeClosed from 'phosphor-icons-svelte/IconEyeClosedRegular.svelte';
	import SunIcon from 'phosphor-icons-svelte/IconSunRegular.svelte';
	import IconArrowsClockwise from 'phosphor-icons-svelte/IconArrowsClockwiseRegular.svelte';
	import IconChats from 'phosphor-icons-svelte/IconChatsRegular.svelte';
	import IconRobot from 'phosphor-icons-svelte/IconRobotRegular.svelte';
	import IconToolbox from 'phosphor-icons-svelte/IconToolboxRegular.svelte';
	import IconPackage from 'phosphor-icons-svelte/IconPackageRegular.svelte';
	import IconWallet from 'phosphor-icons-svelte/IconWalletRegular.svelte';
	import IconDashboard from 'phosphor-icons-svelte/IconChartPieSliceRegular.svelte';
	import IconNotepad from 'phosphor-icons-svelte/IconNotepadRegular.svelte';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { tick } from 'svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';

	import { cn } from '$lib/utils';
	import { sessionCtx } from '$lib/threads';
	import { socketCtx } from '$lib/socket.svelte';
	import { toggleMode } from 'mode-watcher';

	import ServerSwitcher from './server-switcher.svelte';
	import NavBundle from './nav-bundle.svelte';
	import SidebarLink from './sidebar-link.svelte';
	import Tour from './tour/tour.svelte';
	import { onMount } from 'svelte';

	import createClient from 'openapi-fetch';
	import type { paths, components } from '../../generated/api';
	import { Session } from '$lib/session.svelte';
	import { Plus, Send } from '@lucide/svelte';

	import { supabase } from '$lib/supabaseClient';
	import { goto } from '$app/navigation';

	let content = $state('');
	let user_email = $state('');

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
			const client = createClient<paths>({
				baseUrl: `${location.protocol}//${sessCtx.connection.host}`
			});

			connecting = true;
			error = null;
			sessCtx.registry = null;
			const agents = (await client.GET('/api/v1/agents')).data!;
			sessCtx.registry = agents;
			sessCtx.sessions = (await client.GET('/api/v1/sessions')).data!;

			connecting = false;
			return agents;
		} catch (e) {
			connecting = false;
			sessCtx.registry = null;
			error = `${e}`;
			throw e;
		}
	};

	let serverSwitcher = $state(null) as unknown as HTMLButtonElement;
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

	let sessionSearcherOpen = $state(false);
	let value = $state('');
	let triggerRef = $state<HTMLButtonElement>(null!);

	function closeAndFocusTrigger() {
		sessionSearcherOpen = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}
	// todo: refactor below into one object
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
</script>

<Quickswitch {sessCtx} {agents} {threads} />

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
				toast.promise(refreshAgents(), {
					loading: `Connecting to server '${host}'...`,
					success: `Connected to server '${host}'`,
					error: (err) => `Failed to connect to server '${host}', Error: ${err || err}`
				});
			}}
		/>
		<Sidebar.GroupLabel class="pr-0">
			<span
				class="text-muted-foreground w-full grow font-sans font-medium tracking-wide select-none"
				>Server</span
			>
			{#if sessCtx.connection}
				<Tooltip.Provider delayDuration={0}>
					<Tooltip.Root>
						<Tooltip.Trigger disabled={error === null}>
							<span
								class={cn(
									'text-muted-foreground font-mono text-xs font-normal',
									error && 'text-destructive'
								)}
							>
								{#if error}
									disconnected
								{:else if sessCtx.registry}
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
					class="mx	-1 size-7"
					disabled={connecting}
					onclick={() => refreshAgents()}
				>
					<IconArrowsClockwise class={cn('size-4', connecting && 'animate-spin')} />
				</Button>
			{/if}
		</Sidebar.GroupLabel>
		<Sidebar.GroupContent>
			<Sidebar.Menu>
				<SidebarLink url="/registry" icon={IconPackage} title="Agent Registry" />
				<SidebarLink url="/logs" icon={IconNotepad} title="Logs" />
			</Sidebar.Menu>
		</Sidebar.GroupContent>
	</Sidebar.Header>
	<Sidebar.Content class="gap-0 overflow-hidden">
		<Sidebar.Group>
			<Sidebar.Separator />

			<Sidebar.GroupLabel class="text-sidebar-foreground flex flex-row gap-1 pr-0 text-sm">
				<span class="text-muted-foreground grow font-sans font-medium tracking-wide select-none"
					>Finance</span
				>
			</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					<SidebarLink url="/wallet" icon={IconWallet} title="Wallet" />
					<SidebarLink url="/dashboard" icon={IconDashboard} title="Dashboard" />
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
		<Sidebar.Separator class="sticky top-0" />
		<Sidebar.Group class="">
			<Sidebar.GroupContent>
				<Sidebar.GroupLabel class="text-muted-foreground">Session</Sidebar.GroupLabel>
				<Sidebar.GroupAction
					title="Create new session"
					onclick={() => {
						goto(`/sessions/create`);
					}}
					bind:ref={sessionSwitcher}
				>
					<Plus /> <span class="sr-only">Create new session</span>
				</Sidebar.GroupAction>
				<Popover.Root bind:open={sessionSearcherOpen}>
					<Popover.Trigger
						class="bg-sidebar ring-border ring-offset-background aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive w-full flex-1  grow justify-between truncate border border-none shadow-none ring "
						aria-invalid={sessCtx.session === null || !sessCtx.session.connected}
					>
						{#snippet child({ props })}
							<Button
								variant="outline"
								{...props}
								role="combobox"
								aria-expanded={sessionSearcherOpen}
								disabled={sessCtx.sessions && sessCtx.sessions.length === 0}
							>
								{sessCtx.session && sessCtx.session.connected
									? sessCtx.session.session
									: 'Select Session'}
								<CaretUpDown />
							</Button>
						{/snippet}
					</Popover.Trigger>

					<Popover.Content align="center" class="">
						<Command.Root>
							<Command.Input placeholder="Search" />
							<Command.List>
								<Command.Empty>No sessions found</Command.Empty>
								{#if sessCtx.sessions && sessCtx.sessions.length > 0}
									<Command.Group>
										{#each sessCtx.sessions as session}
											<Command.Item
												onSelect={() => {
													value = session;
													closeAndFocusTrigger();
													if (!sessCtx.connection) return;
													sessCtx.session = new Session({ ...sessCtx.connection, session });
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
				</Popover.Root>
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
						}
					]}
				/>
				<SidebarLink
					url="/tools/user-input"
					icon={IconChats}
					title="Input Requests"
					badge={Object.values(tools.userInput.requests).filter(
						(req) => req.userQuestion === undefined
					).length}
				/>
			</Sidebar.GroupContent>
		</Sidebar.Group>

		<form
			onsubmit={handleSubmit}
			class="mt-auto {feedbackVisible
				? 'opacity-100'
				: 'hidden opacity-0 select-none'} absolute bottom-20 left-0 mx-auto px-2 align-bottom transition-opacity duration-75"
		>
			<Card.Root>
				<Card.Header class="flex items-baseline justify-between">
					<Card.Title>Submit feedback</Card.Title>
					<Button
						variant="outline"
						onclick={() => {
							feedbackVisible = false;
						}}>Close</Button
					>
				</Card.Header>
				<Card.Content class="flex flex-col gap-2">
					<p class="text-muted-foreground text-xs">
						Limited from <span
							class={content.length > 0 && content.length < 10 ? 'text-destructive' : ''}>10</span
						>
						to
						<span class={content.length > 4999 ? 'text-destructive' : ''}>5,000 characters</span>,
						for more detailed feedback, please visit our
						<a href="https://discord.gg/fV7sTAQQkk" target="_blank" class="underline">Discord</a>
					</p>
					<Textarea
						placeholder="Type your message here."
						class="h-46"
						minlength={10}
						maxlength={5000}
						bind:value={content}
					/>

					<Input type="email" placeholder="email (optional)" bind:value={user_email} />
				</Card.Content>
				<Card.Footer class="flex justify-between gap-4">
					<Button variant="outline"
						><a href="https://discord.gg/fV7sTAQQkk" target="_blank">Visit our Discord</a></Button
					>
					<Button
						variant="secondary"
						type="submit"
						disabled={content.length < 10 || content.length > 5000}>Send</Button
					>
				</Card.Footer>
			</Card.Root>
		</form>
	</Sidebar.Content>
	<Sidebar.Footer>
		<Sidebar.Menu>
			<Sidebar.MenuItem class="flex justify-end gap-4">
				<Button
					variant="outline"
					onclick={() => {
						feedbackVisible = !feedbackVisible;
					}}>Feedback</Button
				>

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

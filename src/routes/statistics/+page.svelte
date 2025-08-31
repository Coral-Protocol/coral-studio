<script>
	import AgentList from '$lib/components/widgets/agent-list.svelte';
	import TotalSessions from '$lib/components/widgets/total-sessions.svelte';
	import TotalRevenue from '$lib/components/widgets/total-revenue.svelte';
	import ClaimRate from '$lib/components/widgets/claim-rate.svelte';
	import SessionAvg from '$lib/components/widgets/session-avg.svelte';
	import Temp from '$lib/components/widgets/temp.svelte';
	import Wallet from '$lib/components/widgets/wallet.svelte';
	import SessionsOverTime from '$lib/components/widgets/session-over-time.svelte';
	import RevenueOverTime from '$lib/components/widgets/revenue-over-time.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Separator } from '$lib/components/ui/separator';
</script>

<header class="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4">
	<Sidebar.Trigger class="-ml-1" />
	<Separator orientation="vertical" class="mr-2 h-4" />
	<Breadcrumb.Root class="flex-grow">
		<Breadcrumb.List>
			<Breadcrumb.Item class="hidden md:block">
				<Breadcrumb.Link>Server Statistics</Breadcrumb.Link>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>
</header>
<main class="flex grow flex-col items-center justify-center">
	<div
		class="grid h-full w-full grid-cols-1 gap-6 p-32 px-64 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
	>
		<AgentList />
		<Wallet />
		<Temp />
		<Temp />
		<TotalSessions />
		<TotalRevenue />
		<SessionAvg />
		<ClaimRate />
		<SessionsOverTime span="2" />
		<RevenueOverTime span="2" />
	</div>
</main>

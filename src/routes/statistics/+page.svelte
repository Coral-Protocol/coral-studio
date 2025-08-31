<<<<<<< HEAD
<script lang="ts">
=======
<script>
>>>>>>> e35323b (feat: new statistics page)
	import AgentList from '$lib/components/widgets/agent-list.svelte';
	import TotalSessions from '$lib/components/widgets/total-sessions.svelte';
	import TotalRevenue from '$lib/components/widgets/total-revenue.svelte';
	import ClaimRate from '$lib/components/widgets/claim-rate.svelte';
	import SessionAvg from '$lib/components/widgets/session-avg.svelte';
<<<<<<< HEAD
=======
	import Temp from '$lib/components/widgets/temp.svelte';
	import Wallet from '$lib/components/widgets/wallet.svelte';
>>>>>>> e35323b (feat: new statistics page)
	import SessionsOverTime from '$lib/components/widgets/session-over-time.svelte';
	import RevenueOverTime from '$lib/components/widgets/revenue-over-time.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Separator } from '$lib/components/ui/separator';
<<<<<<< HEAD
	import { onMount } from 'svelte';

	import type { ServerStatistics } from '$lib/statisticData';

	async function fetchServerStatistics(): Promise<ServerStatistics> {
		const res = await fetch('/api/server/statistics');
		if (!res.ok) {
			throw new Error(`Failed to load stats: ${res.status}`);
		}
		return res.json() as Promise<ServerStatistics>;
	}

	let statisticData: Promise<ServerStatistics> | undefined = $state();

	onMount(() => {
		statisticData = fetchServerStatistics();
	});
=======
>>>>>>> e35323b (feat: new statistics page)
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
<<<<<<< HEAD
	<div class="grid w-full grid-cols-4 gap-6 px-64 pt-32">
		<SessionsOverTime span="2" {statisticData} />
		<RevenueOverTime span="2" {statisticData} />
	</div>

	<div class="grid w-full grid-cols-2 gap-6 p-32 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
		<AgentList {statisticData} />
		<TotalSessions {statisticData} />
		<TotalRevenue {statisticData} />
		<SessionAvg {statisticData} />
		<ClaimRate {statisticData} />
=======
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
>>>>>>> e35323b (feat: new statistics page)
	</div>
</main>

<<<<<<< HEAD
<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import type { ServerStatistics } from '$lib/statisticData';

	let {
		span = '1',
		class: className = '',
		statisticData
	}: {
		span?: string;
		statisticData: Promise<ServerStatistics> | undefined;
		class?: string;
	} = $props();
=======
<script>
	import * as Card from '$lib/components/ui/card';

	let { span = '1', data = [] } = $props();
>>>>>>> e35323b (feat: new statistics page)
</script>

<Card.Root class="col-span-{span}">
	<Card.Header>
		<Card.Title>Total Revenue</Card.Title>
	</Card.Header>
	<Card.Content class="flex h-24 flex-col items-center justify-center gap-2">
<<<<<<< HEAD
		{#await statisticData}
			<p>Loading…</p>
		{:then stats}
			<h1 class="text-4xl font-bold">{stats?.totalMicroCoralsRevenue}</h1>
		{:catch err}
			<p>Error loading stats</p>
		{/await}
=======
		<h1 class="text-4xl font-bold">$51</h1>
>>>>>>> e35323b (feat: new statistics page)
		<span class="text-chart-1 text-sm">+8.2%</span>
	</Card.Content>
</Card.Root>

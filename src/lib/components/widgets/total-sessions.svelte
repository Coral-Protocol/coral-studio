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
</script>

<Card.Root class="col-span-{span}">
	<Card.Header>
		<Card.Title>Total Sessions</Card.Title>
	</Card.Header>
	<Card.Content class="flex h-24 flex-col items-center justify-center gap-2">
		{#await statisticData}
			<p>Loading…</p>
		{:then stats}
			<h1 class="text-4xl font-bold">{stats?.totalSessionCount}</h1>
		{:catch err}
			<p>Error loading stats</p>
		{/await}
		<span class="text-chart-1 text-sm">+5.2%</span>
	</Card.Content>
</Card.Root>

<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { scaleUtc } from 'd3-scale';
<<<<<<< HEAD
	import { curveMonotoneX } from 'd3-shape';
	import { Area, AreaChart, LinearGradient } from 'layerchart';
	import type { ServerStatistics } from '$lib/statisticData';

	const chartConfig = {
		desktop: { label: 'Sessions', color: 'var(--chart-1)' }
	} satisfies Chart.ChartConfig;

	let {
		span = '2',
		class: className = '',
		statisticData
	}: {
		span?: string;
		statisticData: Promise<ServerStatistics> | undefined;
		class?: string;
	} = $props();

	function mapSnapshotsToChartData(stats: ServerStatistics) {
		return stats.totalMicroCoralsRevenueSnapshots.map((snap) => ({
			date: new Date(snap.Timestamp),
			desktop: snap.totalMicroCoralsRevenue
		}));
	}
</script>

<Card.Root class="col-span-{span} {className}">
	<Card.Header>
		<Card.Title>Sessions over time</Card.Title>
	</Card.Header>
	<Card.Content>
		<Chart.Container config={chartConfig}>
			{#await statisticData}
				<p>Loading…</p>
			{:then stats}
				{#if stats && stats?.totalMicroCoralsRevenueSnapshots.length > 0}
					<AreaChart
						data={mapSnapshotsToChartData(stats)}
						x="date"
						xScale={scaleUtc()}
						yPadding={[0, 25]}
						series={[
							{
								key: 'desktop',
								label: 'Sessions',
								color: 'var(--color-desktop)'
							}
						]}
						seriesLayout="stack"
						props={{
							area: {
								curve: curveMonotoneX,
								'fill-opacity': 0.4,
								line: { class: 'stroke-1' },
								motion: 'none'
							},
							xAxis: {
								format: (v: Date) => v.toLocaleDateString('en-US', { month: 'short' })
							},
							yAxis: { format: () => '' }
						}}
					>
						{#snippet tooltip()}
							<Chart.Tooltip
								indicator="dot"
								labelFormatter={(v: Date) =>
									v.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
							/>
						{/snippet}

						{#snippet marks({ series, getAreaProps })}
							{#each series as s, i (s.key)}
								<LinearGradient
									stops={[s.color ?? '', `color-mix(in lch, ${s.color} 10%, transparent)`]}
									vertical
								>
									{#snippet children({ gradient })}
										<Area {...getAreaProps(s, i)} fill={gradient} />
									{/snippet}
								</LinearGradient>
							{/each}
						{/snippet}
					</AreaChart>
				{:else}
					<p>No session data available</p>
				{/if}
			{:catch err}
				<p>Error loading stats</p>
			{/await}
=======
	import {
		curveBasis,
		curveMonotoneX,
		curveCardinal,
		curveCatmullRom,
		curveNatural,
		curveStep
	} from 'd3-shape';
	import { Area, AreaChart, LinearGradient } from 'layerchart';
	import type { ServerStatistics } from '$lib/statisticData';

	const chartConfig = {
		desktop: { label: 'Sessions', color: 'var(--chart-1)' }
	} satisfies Chart.ChartConfig;

	let {
		span = '2',
		class: className = '',
		statisticData
	}: {
		span?: string;
		statisticData: Promise<ServerStatistics> | undefined;
		class?: string;
	} = $props();

	function mapSnapshotsToChartData(stats: ServerStatistics) {
		return stats.totalMicroCoralsRevenueSnapshots.map((snap) => ({
			date: new Date(snap.Timestamp),
			desktop: snap.totalMicroCoralsRevenue
		}));
	}
</script>

<Card.Root class="col-span-{span} {className}">
	<Card.Header>
		<Card.Title>Sessions over time</Card.Title>
	</Card.Header>
	<Card.Content>
		<Chart.Container config={chartConfig}>
			<AreaChart
				data={chartData}
				x="date"
				xScale={scaleUtc()}
				yPadding={[0, 25]}
				series={[
					{
						key: 'mobile',
						label: 'Mobile',
						color: 'var(--color-mobile)'
					}
				]}
				seriesLayout="stack"
				props={{
					area: {
						curve: curveMonotoneX,
						'fill-opacity': 0.4,
						line: { class: 'stroke-1' },
						motion: 'none'
					},
					xAxis: {
						format: (v: Date) => v.toLocaleDateString('en-US', { month: 'short' })
					},
					yAxis: { format: () => '' }
				}}
			>
				{#snippet tooltip()}
					<Chart.Tooltip
						indicator="dot"
						labelFormatter={(v: Date) => {
							return v.toLocaleDateString('en-US', {
								month: 'long'
							});
						}}
					/>
				{/snippet}
				{#snippet marks({ series, getAreaProps })}
					{#each series as s, i (s.key)}
						<LinearGradient
							stops={[s.color ?? '', 'color-mix(in lch, ' + s.color + ' 10%, transparent)']}
							vertical
						>
							{#snippet children({ gradient })}
								<Area {...getAreaProps(s, i)} fill={gradient} />
							{/snippet}
						</LinearGradient>
					{/each}
				{/snippet}
			</AreaChart>
>>>>>>> e35323b (feat: new statistics page)
		</Chart.Container>
	</Card.Content>
</Card.Root>

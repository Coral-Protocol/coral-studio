<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { scaleUtc } from 'd3-scale';
	import {
		curveBasis,
		curveMonotoneX,
		curveCardinal,
		curveCatmullRom,
		curveNatural,
		curveStep
	} from 'd3-shape';
	import { Area, AreaChart, LinearGradient } from 'layerchart';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';

	const chartData: {
		date: Date;
		mobile: number; // random mobile values (50–250)
	}[] = [];
	let startDate = new Date('2024-01-01');

	for (let i = 0; i < 10; i++) {
		chartData.push({
			date: new Date(startDate),
			mobile: Math.floor(Math.random() * 100) + 50 // random mobile values (50–250)
		});

		// Move ahead by 7 days
		startDate.setDate(startDate.getDate() + 7);
	}

	const chartConfig = {
		mobile: { label: 'Mobile', color: 'var(--chart-1)' }
	} satisfies Chart.ChartConfig;
	let { span = '2', data = [] } = $props();
</script>

<Card.Root class="col-span-2">
	<Card.Header>
		<Card.Title>Revenue over time</Card.Title>
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
		</Chart.Container>
	</Card.Content>
</Card.Root>

<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { ArcChart, Text } from 'layerchart';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import type { ServerStatistics } from '$lib/statisticData';

	const chartData = [{ browser: 'safari', visitors: 80, color: 'var(--color-safari)' }];

	const chartConfig = {
		visitors: { label: 'Visitors' },
		safari: { label: 'Safari', color: 'var(--chart-2)' }
	} satisfies Chart.ChartConfig;
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

<Card.Root>
	<Card.Header class="items-center">
		<Card.Title>Claim rate</Card.Title>
	</Card.Header>
	<Card.Content class="flex-1">
		<Chart.Container config={chartConfig} class="mx-auto aspect-square max-h-[150px]">
			<ArcChart
				label="browser"
				value="visitors"
				outerRadius={-20}
				innerRadius={-12}
				padding={0}
				range={[-90, 90]}
				maxValue={100}
				cornerRadius={20}
				series={chartData.map((d) => ({
					key: d.browser,
					color: d.color,
					data: [d]
				}))}
				props={{
					arc: { track: { fill: 'var(--muted)' }, motion: 'tween' },
					tooltip: { context: { hideDelay: 350 } }
				}}
				tooltip={false}
			>
				{#snippet aboveMarks()}
					<Text
						value="{String(chartData[0].visitors)}%"
						textAnchor="middle"
						verticalAnchor="middle"
						class="fill-foreground text-4xl! font-bold"
						dy={-3}
					/>
				{/snippet}
			</ArcChart>
		</Chart.Container>
	</Card.Content>
</Card.Root>

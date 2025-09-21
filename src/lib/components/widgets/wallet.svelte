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
		<Card.Title>Wallet</Card.Title>
	</Card.Header>
	<Card.Content>
		<p>widget placeholder</p>
	</Card.Content>
</Card.Root>

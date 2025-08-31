<script>
	import * as Card from '$lib/components/ui/card';

	let { span = '1', data = [] } = $props();
</script>

<Card.Root class="col-span-{span}">
	<Card.Header>
		<Card.Title>Total Revenue</Card.Title>
	</Card.Header>
	<Card.Content class="flex h-24 flex-col items-center justify-center gap-2">
		<h1 class="text-4xl font-bold">$51</h1>
		<span class="text-chart-1 text-sm">+8.2%</span>
	</Card.Content>
</Card.Root>

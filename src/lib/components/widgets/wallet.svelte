<script>
	import * as Card from '$lib/components/ui/card';

	let { span = '1', data = [] } = $props();
</script>

<Card.Root class="col-span-{span}">
	<Card.Header>
		<Card.Title>Wallet</Card.Title>
	</Card.Header>
	<Card.Content>
		<p>widget placeholder</p>
	</Card.Content>
</Card.Root>

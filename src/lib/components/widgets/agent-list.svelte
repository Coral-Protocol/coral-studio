<<<<<<< HEAD
<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select/index.js';
	import type { ServerStatistics } from '$lib/statisticData';

	const fruits = [
		{ value: 'apple', label: 'Apple' },
		{ value: 'banana', label: 'Banana' },
		{ value: 'blueberry', label: 'Blueberry' },
		{ value: 'grapes', label: 'Grapes' },
		{ value: 'pineapple', label: 'Pineapple' }
	];

	let value = $state('');

	const triggerContent = $derived(fruits.find((f) => f.value === value)?.label ?? 'Select a fruit');
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
		<Card.Title>Agent list</Card.Title>
	</Card.Header>
	<Card.Content>
<<<<<<< HEAD
		<Select.Root type="single" name="favoriteFruit" bind:value>
			<Select.Trigger class="w-full">
				{triggerContent}
			</Select.Trigger>
			<Select.Content>
				<Select.Group>
					<Select.Label>Fruits</Select.Label>
					{#each fruits as fruit (fruit.value)}
						<Select.Item
							value={fruit.value}
							label={fruit.label}
							disabled={fruit.value === 'grapes'}
						>
							{fruit.label}
						</Select.Item>
					{/each}
				</Select.Group>
			</Select.Content>
		</Select.Root>
=======
		<p>widget placeholder</p>
>>>>>>> e35323b (feat: new statistics page)
	</Card.Content>
</Card.Root>

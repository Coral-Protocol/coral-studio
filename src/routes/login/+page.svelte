<script lang="ts">
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { page } from '$app/state';
	import Logo from '$lib/icons/logo.svelte';
	import { onMount } from 'svelte';

	let form = $state() as HTMLFormElement;
	onMount(() => {
		form.action = `/api/v1/auth?to=${encodeURIComponent(page.url.searchParams.get('to') || '/')}`;
	});
</script>

<main class="flex h-screen w-screen">
	<form
		bind:this={form}
		class="m-auto flex w-md flex-col items-center gap-4"
		method="POST"
		action="/api/v1/auth"
	>
		<header class="flex gap-2 pb-8">
			<Logo class="h-12 w-12" />
			<section class="flex flex-col gap-1">
				<h1 class="font-sans font-bold tracking-widest uppercase">Coral Protocol</h1>
				<h2 class="text-accent font-sans text-xs font-bold tracking-widest uppercase">Console</h2>
			</section>
		</header>
		<Field.Set class="w-full">
			<Field.Group>
				<Field.Field>
					<Field.Label for="password">Access token</Field.Label>
					<Input id="password" type="password" name="password" />
				</Field.Field>
			</Field.Group>
		</Field.Set>
		<Field.Field orientation="horizontal" class="flex justify-between">
			<Button variant="outline" type="button">Help</Button>
			<Button type="submit">Enter</Button>
		</Field.Field>
	</form>
</main>

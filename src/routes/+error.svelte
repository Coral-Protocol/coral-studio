<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import IconAlertCircle from 'phosphor-icons-svelte/IconWarningCircleRegular.svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';

	let reload = $state(false);
</script>

<main
	class="fixed top-1/2 left-1/2 flex w-1/2 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4"
>
	<Alert.Root>
		<IconAlertCircle />
		<Alert.Title>Oops! Something went wrong.</Alert.Title>
		<Alert.Description>
			<h1>Status: <span class="text-destructive">{page.status}</span></h1>
			<p>Error: <span class="text-destructive">{page.error?.message}</span></p>
		</Alert.Description>
	</Alert.Root>

	<ol class="mt-4 flex gap-2">
		<Button href="/">Go Home</Button>
		<Button onclick={() => window.history.back()}>Go Back</Button>
		<Button onclick={() => (window.location.reload(), (reload = true))} class="relative">
			<Spinner
				class="absolute top-1/2 left-1/2 flex w-1/2 -translate-x-1/2 -translate-y-1/2 {reload
					? 'opacity-100'
					: 'opacity-0'}"
			/>
			<span class={reload ? 'opacity-0' : 'opacity-100'}>Retry</span>
		</Button>
	</ol>
</main>

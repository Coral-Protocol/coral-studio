<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import * as Sidebar from '$lib/components/ui/sidebar';

	import { Separator } from '$lib/components/ui/separator';

	import AppSidebar from '$lib/components/app-sidebar.svelte';

	import IconCrane from 'phosphor-icons-svelte/IconCraneRegular.svelte';
</script>

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset>
		<header class="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4">
			<Sidebar.Trigger class="-ml-1" />
			<Separator orientation="vertical" class="mr-2 h-4" />
			<Breadcrumb.Root class="flex-grow">
				<Breadcrumb.List>
					<Breadcrumb.Item class="hidden md:block">
						<Breadcrumb.Link>Logs</Breadcrumb.Link>
					</Breadcrumb.Item>
				</Breadcrumb.List>
			</Breadcrumb.Root>
		</header>
		<main class="flex grow flex-col items-center justify-center">
			<IconCrane class="size-14" />
			<h2 class="text-xl">This page is under construction!</h2>
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>

<script lang="ts">
	import * as Breadcrumb from '@coral-os/component-library/ui/breadcrumb/index.js';
	import * as Sidebar from '@coral-os/component-library/ui/sidebar/index.js';
	import { Separator } from '@coral-os/component-library/ui/separator/index.js';
</script>

<header class="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4">
	<Sidebar.Trigger class="-ml-1" />
	<Separator orientation="vertical" class="mr-2 h-4" />
	<Breadcrumb.Root class="flex-grow">
		<Breadcrumb.List>
			<Breadcrumb.Item class="hidden md:block">
				<Breadcrumb.Link>Server</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator></Breadcrumb.Separator>
			<Breadcrumb.Page>Home</Breadcrumb.Page>
			<Breadcrumb.Item class="hidden md:block"></Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>
</header>

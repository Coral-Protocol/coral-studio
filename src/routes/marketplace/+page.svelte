<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Separator } from '$lib/components/ui/separator';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';

	import IconCPU from 'phosphor-icons-svelte/IconCpuRegular.svelte';
	import IconBox from 'phosphor-icons-svelte/IconBoundingBoxRegular.svelte';
	import IconDots from 'phosphor-icons-svelte/IconDotsThreeRegular.svelte';

	const agents = [
		{
			id: 1,
			name: 'Agent Alpha',
			maker: 'Maker A',
			img: 'https://placehold.co/42x42',
			desc: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et ma',
			framework: 'Langchain',
			model: 'GPT-4'
		},
		{
			id: 2,
			name: 'Agent Beta',
			maker: 'Maker B',
			img: 'https://placehold.co/42x42',
			desc: 'aaaaaaaa',
			framework: 'Weaviate',
			model: 'GPT-3.5'
		},
		{
			id: 3,
			name: 'Agent Gamma',
			maker: 'Maker C',
			img: 'https://placehold.co/42x42',
			desc: 'The European languages are members of the same family. Their separate existence is a myth. For science, music, sport, etc, Europe uses the s',
			framework: 'Haystack',
			model: 'Claude'
		},
		{
			id: 4,
			name: 'Agent Delta',
			maker: 'Maker D',
			img: 'https://placehold.co/42x42',
			desc: 'abc def ghi jkl mno pqrs tuv wxyz ABC DEF GHI JKL MNO PQRS TUV WXYZ !"§ $%& /() =?* ©«» ¤¼× {} abc def ghi jkl mno pqrs tuv.',
			framework: 'Langchain',
			model: 'GPT-4o'
		}
	];
</script>

<header class="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4">
	<Sidebar.Trigger class="-ml-1" />
	<Separator orientation="vertical" class="mr-2 h-4" />
	<Breadcrumb.Root class="flex-grow">
		<Breadcrumb.List>
			<Breadcrumb.Item>
				<Breadcrumb.Page>Marketplace</Breadcrumb.Page>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>
</header>
<h1 class="py-8 text-center text-3xl">Coral Marketplace</h1>
<section class="flex items-center gap-4 border-b p-4 px-32">
	<Input type="text" placeholder="What do you need?" class="w-64 rounded-md border p-2" />
	<Button>Smart Search</Button>
	<Button>Filter</Button>
	{Array(12)
		.fill(agents)
		.flatMap((x) => x).length} agents found

	<Button class="ml-auto">A spare button</Button>
</section>
<Tabs.Root value="v1" class="h-full min-h-0 grow overflow-scroll">
	<Tabs.List class="m-0 h-8 w-8 border-0 pl-12">
		<Tabs.Trigger value="v1">v1</Tabs.Trigger>
		<Tabs.Trigger value="v2">v2</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="v1" class="h-full min-h-0 grow overflow-scroll">
		<section
			class="max-w-2/3q mx-auto grid h-full min-h-0 grow grid-cols-1 gap-4 overflow-scroll p-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
		>
			{#each Array(12)
				.fill(agents)
				.flatMap((x) => x) as item}
				<button>
					<Card.Root class="hover:bg-primary/80 group h-full py-4 text-left transition-colors">
						<Card.Header class="flex px-4">
							<img src={item.img} alt={item.name} class="overflow-clip rounded-md" />
							<section class="flex h-full flex-col justify-between gap-1">
								<Card.Title>{item.name}</Card.Title>
								<Card.Description><a href="itemmakerprofile">{item.maker}</a></Card.Description>
							</section>
							<section class="ml-auto flex gap-2"></section>
						</Card.Header>
						<Card.Content class="px-4">
							<p class="text-muted-foreground group-hover:text-primary-foreground text-sm">
								{item.desc}
							</p>
						</Card.Content>
					</Card.Root>
				</button>
			{/each}
		</section>
	</Tabs.Content>
	<Tabs.Content value="v2">
		<section
			class="mx-auto grid h-full min-h-0 max-w-1/2 grow grid-cols-1 gap-4 overflow-scroll p-4 md:grid-cols-1 xl:grid-cols-2"
		>
			{#each Array(12)
				.fill(agents)
				.flatMap((x) => x) as item}
				<button>
					<Card.Root
						class="hover:bg-primary/80 bg-background h-full border-0 py-4 text-left transition-colors hover:shadow-md"
					>
						<Card.Header class="flex px-4">
							<img src={item.img} alt={item.name} class="overflow-clip rounded-md" />
							<section class="flex h-full flex-col justify-between gap-1">
								<Card.Title>{item.name}</Card.Title>
								<Card.Description
									><a href="itemmakerprofile">{item.maker}</a> - {item.framework} - {item.model}</Card.Description
								>
							</section>
							<section class="ml-auto flex gap-2">
								<Button
									variant="ghost"
									size="icon"
									class="group-hover:text-primary-foreground text-background		"
								>
									<IconDots />
								</Button>
							</section>
						</Card.Header>
						<Card.Content class="text-muted-foreground px-4 text-xs">
							<p class="text-sm">{item.desc}</p>
						</Card.Content>
					</Card.Root>
				</button>
			{/each}
		</section>
	</Tabs.Content>
</Tabs.Root>

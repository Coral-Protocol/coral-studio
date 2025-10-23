<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Separator } from '$lib/components/ui/separator';
	import IconCrane from 'phosphor-icons-svelte/IconCraneRegular.svelte';
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
<section
	class="grid h-full min-h-0 grow grid-cols-1 gap-4 overflow-scroll p-4 px-16 md:grid-cols-1 lg:grid-cols-3 xl:grid-cols-4"
>
	{#each Array(12)
		.fill(agents)
		.flatMap((x) => x) as item}
		<Card.Root class="py-4 ">
			<Card.Header class="flex px-4">
				<img src={item.img} alt={item.name} class="overflow-clip rounded-md" />
				<section class="flex h-full flex-col justify-between gap-1">
					<Card.Title>{item.name}</Card.Title>
					<Card.Description><a href="itemmakerprofile">{item.maker}</a></Card.Description>
				</section>
				<Button class="ml-auto" size="icon">
					<IconDots />
				</Button>
			</Card.Header>
			<Card.Content class="px-4">
				<p class="text-sm">{item.desc}</p>
			</Card.Content>
			<Card.Footer class="mt-auto flex justify-between px-4 text-sm">
				<section class="flex flex-col justify-between gap-2">
					<p class="flex items-center gap-2"><IconCPU /> Framework:</p>
					<p class="flex items-center gap-2"><IconBox /> Model:</p>
				</section>
				<section class="flex flex-col justify-between gap-2">
					<p>{item.framework}</p>
					<p>{item.model}</p>
				</section>
			</Card.Footer>
		</Card.Root>
	{/each}
</section>

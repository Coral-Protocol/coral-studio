<script lang="ts">
	import type { FormSchema } from './schemas';
	import z from 'zod';

	import { VisSingleContainer, VisGraph } from '@unovis/svelte';
	import { idAsKey } from '$lib/threads';

	let {
		agents,
		groups
	}: { agents: z.infer<FormSchema>['agents']; groups: z.infer<FormSchema>['groups'] } = $props();

	type NodeDatum = {
		id?: string;
	};

	type LinkDatum = {
		id?: string;
		source: number | string | NodeDatum;
		target: number | string | NodeDatum;
	};
	type GraphData = {
		nodes: NodeDatum[];
		links: LinkDatum[];
	};

	const notNull = <T,>(x: T | null): x is T => x !== null; // i hate typescript
	const edgesFromGroups = (groups: string[][]): LinkDatum[] => {
		const seen = new Set<string>();
		return groups.flatMap((group) =>
			group
				.flatMap((a, i) =>
					group.slice(i + 1).map((b) => {
						const key = [a, b].sort().join('|');
						if (seen.has(key)) return null;
						seen.add(key);
						return { source: a, target: b };
					})
				)
				.filter(notNull)
		);
	};

	let data: GraphData = $derived({
		nodes: agents.map((agent) => ({ id: agent.name })),
		links: edgesFromGroups(groups)
	});
</script>

<VisSingleContainer {data} class="size-full">
	<VisGraph />
</VisSingleContainer>

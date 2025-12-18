<script lang="ts">
	import { page } from '$app/state';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import ChevronRightIcon from 'phosphor-icons-svelte/IconCaretRightRegular.svelte';
	import type { Component } from 'svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import SidebarMenuBadge from '$lib/components/ui/sidebar/sidebar-menu-badge.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import SidebarLink from './sidebar-link.svelte';
	import { cn } from '$lib/utils';
	import type { AgentStateEnum } from '$lib';

	let {
		items
	}: {
		items: {
			disabled?: boolean;
			title: string;
			icon?: Component;
			sumBadges?: boolean;
			items: {
				id?: string;
				title: string;
				url: string;
				badge?: number;
				state?: AgentStateEnum;
			}[];
		}[];
	} = $props();

	const stateColors: { [K in AgentStateEnum]: string } = {
		disconnected: 'border-primary/30 border bg-transparent',
		connecting: 'bg-primary/30 animate-pulse',
		listening: 'bg-green-400',
		busy: 'bg-orange-400 animate-pulse',
		dead: 'bg-destructive'
	};
</script>

<Sidebar.Menu>
	{#each items as item (item.title)}
		{@const activeSubitems = item.items.map((sub) => page.url.pathname === sub.url)}
		{@const badgeSum = item.sumBadges
			? item.items.reduce((acc, cur) => {
					return acc + (cur.badge ?? 0);
				}, 0)
			: 0}
		<Collapsible.Root open={activeSubitems.indexOf(true) != -1} class="group/collapsible">
			{#snippet child({ props })}
				<Collapsible.Trigger {...props} disabled={item.items.length === 0 || item.disabled}>
					{#snippet child({ props })}
						<SidebarLink
							{...props}
							title={item.title}
							icon={item.icon}
							badge={badgeSum}
							collapsible
						/>
					{/snippet}
				</Collapsible.Trigger>
				<Collapsible.Content>
					<Sidebar.MenuSub>
						{#each item.items as subItem, i (subItem.id ?? subItem.title)}
							<Sidebar.MenuSubItem>
								<Sidebar.MenuSubButton isActive={activeSubitems[i]}>
									{#snippet child({ props })}
										<Tooltip.Provider>
											<Tooltip.Root>
												<Tooltip.Trigger {...props}>
													{#snippet child({ props })}
														<a href={subItem.url} {...props}>
															{#if subItem.state}
																<span class={cn('size-2 rounded-full', stateColors[subItem.state])}
																	><span class="sr-only">({subItem.state})</span></span
																>
															{/if}
															<span class="truncate font-sans font-medium tracking-wide"
																>{subItem.title}</span
															>
															{#if subItem.badge}
																<Badge>{subItem.badge}</Badge>
															{/if}
														</a>
													{/snippet}
												</Tooltip.Trigger>
												<Tooltip.Content
													><p>{subItem.title} - {subItem.state || ''}</p></Tooltip.Content
												>
											</Tooltip.Root>
										</Tooltip.Provider>
									{/snippet}
								</Sidebar.MenuSubButton>
							</Sidebar.MenuSubItem>
						{/each}
					</Sidebar.MenuSub>
				</Collapsible.Content>
			{/snippet}
		</Collapsible.Root>
	{/each}
</Sidebar.Menu>
